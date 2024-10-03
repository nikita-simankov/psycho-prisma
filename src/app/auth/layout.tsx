import React from 'react'

interface Properties {
  children: React.ReactNode
}

const AuthLayout: React.FC<Properties> = ({ children }) => (
  <div className="flex flex-col items-center justify-center w-full min-h-screen overflow-hidden">
    {children}
  </div>
)

export default AuthLayout
