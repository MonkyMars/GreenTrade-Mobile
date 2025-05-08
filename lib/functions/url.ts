export const encodeQueryParam = (value: string) => {
  return encodeURIComponent(value).replace(/%20/g, '+')
}

export const isUrl = (url: string) => {
  return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(url)
}
