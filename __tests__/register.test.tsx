import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '@/app/(auth)/register/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('RegisterPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders registration form', () => {
    render(<RegisterPage />)

    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('shows link to login page', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByText('Sign in')
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('allows user to fill in the form', () => {
    render(<RegisterPage />)

    const nameInput = screen.getByPlaceholderText('Your name')
    const emailInput = screen.getByPlaceholderText('your@email.com')
    const passwordInput = screen.getByPlaceholderText('Create a password')

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(nameInput).toHaveValue('Test User')
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('submits form and redirects on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Test', email: 'test@example.com' }),
    })

    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Create a password'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    // Wait for the async operation
    await screen.findByRole('button')

    expect(global.fetch).toHaveBeenCalledWith('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    })
  })

  it('shows error message on failed registration', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'User already exists' }),
    })

    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('Your name'), {
      target: { value: 'Test' },
    })
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Create a password'), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    const errorMessage = await screen.findByText('User already exists')
    expect(errorMessage).toBeInTheDocument()
  })
})
