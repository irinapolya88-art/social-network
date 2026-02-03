import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import SettingsPage from '@/app/settings/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('SettingsPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('redirects to login if not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<SettingsPage />)

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('shows loading state while loading session', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<SettingsPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders settings page when authenticated', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '1', name: 'Test' } },
      status: 'authenticated',
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ language: 'ru' }),
    })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
    expect(screen.getByText('Translation Language')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('displays language options', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '1', name: 'Test' } },
      status: 'authenticated',
    })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ language: 'ru' }),
    })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('ru')
  })

  it('allows changing language', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '1', name: 'Test' } },
      status: 'authenticated',
    })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ language: 'ru' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ language: 'en' }),
      })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'en' } })

    expect(select).toHaveValue('en')
  })

  it('saves language on button click', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '1', name: 'Test' } },
      status: 'authenticated',
    })
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ language: 'ru' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ language: 'ru' }),
      })

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Click save button
    const saveButton = screen.getByRole('button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2) // First GET, then PUT
    })
  })
})
