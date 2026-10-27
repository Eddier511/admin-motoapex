const [major, minor, patch] = process.versions.node.split(".").map(Number)
const supported =
  (major === 22 && (minor > 23 || (minor === 23 && patch >= 4))) ||
  (major === 24 && (minor > 22 || (minor === 22 && patch >= 1))) ||
  (major === 26 && (minor > 12 || (minor === 12 && patch >= 1)))
if (!supported) {
  throw new Error(
    "Usa Node 22.23.4+, 24.22.1+ o 26.12.1+ en la rama correspondiente. Consulta .node-version.",
  )
}
console.log(`Runtime de compilación verificado: ${process.version}`)
