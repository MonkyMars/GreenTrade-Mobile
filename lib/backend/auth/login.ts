interface LoginUser {
  email: string
  password: string
}

export const Login = async (user: LoginUser) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL_PUBLIC}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    },
  )
  return response.json()
}
