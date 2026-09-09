declare module 'clarinet' {
  interface ClarinetParser {
    onerror: (e: Error) => void
    onvalue: (v: string | number | boolean | null) => void
    onopenobject: (key: string) => void
    onkey: (key: string) => void
    oncloseobject: () => void
    onopenarray: () => void
    onclosearray: () => void
    onend: () => void
    write: (data: string) => ClarinetParser
    close: () => void
    error: Error | null
    resume: () => void
  }

  function parser(): ClarinetParser

  export { parser, ClarinetParser }
}
