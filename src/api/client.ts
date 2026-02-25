export async function checkHealth() {
  return window.api.checkHealth()
}

export async function listTables() {
  return window.api.listTables()
}

export async function login(loginValue: string, password: string) {
  return window.api.login(loginValue, password)
}

export async function listProducts(options?: import('../types/electron-api').ProductListRequest) {
  return window.api.listProducts(options)
}

export async function createProduct(product: import('../types/electron-api').ProductWritePayload) {
  return window.api.createProduct(product)
}

export async function updateProduct(article: string, product: import('../types/electron-api').ProductWritePayload) {
  return window.api.updateProduct(article, product)
}

export async function deleteProduct(article: string) {
  return window.api.deleteProduct(article)
}
