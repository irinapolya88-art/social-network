import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import LoginPage from '@/app/(auth)/login/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

describe('LoginPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    })
  })

  it('renders login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('shows link to register page', () => {
    render(<LoginPage />)

    const registerLink = screen.getByText('Sign up')
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('allows user to fill in the form', () => {
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('your@email.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('calls signIn on form submit', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({ ok: true })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    // Wait for async operation
    await screen.findByRole('button')

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    })
  })

  it('shows error on failed login', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrongpassword' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    const errorMessage = await screen.findByText('Invalid email or password')
    expect(errorMessage).toBeInTheDocument()
  })
})
