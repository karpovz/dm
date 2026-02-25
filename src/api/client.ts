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
  // Тонкий прокси к preload API: UI не обращается к Electron bridge напрямую.
  return window.api.listProducts(options)
}

export async function getProduct(article: string) {
  return window.api.getProduct(article)
}

export async function createProduct(
  product: import('../types/electron-api').ProductWritePayload,
  actorRoleCode?: import('../types/electron-api').UserRoleCode,
) {
  return window.api.createProduct(product, actorRoleCode)
}

export async function updateProduct(
  article: string,
  product: import('../types/electron-api').ProductWritePayload,
  actorRoleCode?: import('../types/electron-api').UserRoleCode,
) {
  return window.api.updateProduct(article, product, actorRoleCode)
}

export async function deleteProduct(article: string, actorRoleCode?: import('../types/electron-api').UserRoleCode) {
  return window.api.deleteProduct(article, actorRoleCode)
}

export async function saveProductImage(
  payload: import('../types/electron-api').ProductImageUploadPayload,
  actorRoleCode?: import('../types/electron-api').UserRoleCode,
) {
  return window.api.saveProductImage(payload, actorRoleCode)
}
