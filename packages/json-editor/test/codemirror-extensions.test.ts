import { describe, expect, it } from 'vitest'
import { createCodeMirror } from '../src/vue/useCodeMirror'
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view'
import { StateEffect, StateField } from '@codemirror/state'

/**
 * P2 回归：站点 `CodeMirrorEditor.vue` 把 diff / 高亮 StateField 作为扩展注入
 * 包内的 `createCodeMirror`。这些装饰走的是 CodeMirror 的 RAF/measure，
 * 在 jsdom 里不稳定，所以这里只确定性地验证「注入机制 + StateField 模式」：
 * 把效果 dispatch 进去后，`view.state.field(field)` 必须能在目标行拿到装饰。
 * 这正是 `setLineDecorations` 所依赖的路径。站点始终基于当前行号重算装饰，
 * 不依赖跨编辑的映射，因此这里不测映射。
 */
describe('createCodeMirror — injected line-decoration StateField (P2)', () => {
  it('applies an injected decoration field and resolves it at the right line', () => {
    const effect = StateEffect.define<DecorationSet>()
    const field = StateField.define<DecorationSet>({
      create: () => Decoration.none,
      update(value, tr) {
        for (const e of tr.effects) if (e.is(effect)) return e.value
        return value.map(tr.changes)
      },
      provide: (f) => EditorView.decorations.from(f),
    })

    const parent = document.createElement('div')
    document.body.appendChild(parent)

    let view!: EditorView
    createCodeMirror({
      parent,
      doc: '{\n  "a": 1,\n  "b": 2\n}',
      extensions: [field],
      onReady: (v) => {
        view = v
      },
    })

    const doc = view.state.doc
    const line2From = doc.line(2).from
    // 与站点 CodeMirrorEditor.vue 完全相同的装饰形状
    view.dispatch({
      effects: effect.of(
        Decoration.set([Decoration.line({ attributes: { class: 'diff-added' } }).range(line2From)])
      ),
    })

    const set = view.state.field(field)
    expect(set.size).toBe(1)

    const iter = set.iter()
    expect(iter.from).toBe(line2From)
    const cls = (iter.value as { spec?: { attributes?: { class?: string } } }).spec?.attributes?.class
    expect(cls).toContain('diff-added')

    view.destroy()
    document.body.removeChild(parent)
  })
})
