/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfilePageClient, type ProfileUser } from './ProfilePageClient'
import { updateProfile } from './actions'

jest.mock('./actions', () => ({
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  requestPasswordChangeOtp: jest.fn(),
  deleteAccount: jest.fn(),
  requestDeleteAccountOtp: jest.fn(),
  GOAL_OPTIONS: [
    'HYPERTROPHY',
    'FAT_LOSS',
    'STRENGTH',
    'CONDITIONING',
    'GENERAL_HEALTH',
    'FLEXIBILITY',
  ],
}))

const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>

const BASE_USER: ProfileUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'John Doe',
  bio: null,
  age: null,
  goals: [],
  avatarUrl: null,
  image: null,
  hasPassword: true,
  isTrainer: false,
}

describe('ProfilePageClient — toggle isTrainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the switch reflecting the current isTrainer value', () => {
    render(<ProfilePageClient user={BASE_USER} />)

    const switchEl = screen.getByRole('switch', { name: /tornar-se preparador/i })
    expect(switchEl).toHaveAttribute('aria-checked', 'false')
  })

  it('renders the switch as checked when user.isTrainer is true', () => {
    render(<ProfilePageClient user={{ ...BASE_USER, isTrainer: true }} />)

    const switchEl = screen.getByRole('switch', { name: /tornar-se preparador/i })
    expect(switchEl).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles isTrainer and persists it via updateProfile on submit', async () => {
    mockUpdateProfile.mockResolvedValue({ success: true })

    render(<ProfilePageClient user={BASE_USER} />)

    const switchEl = screen.getByRole('switch', { name: /tornar-se preparador/i })
    await userEvent.click(switchEl)
    expect(switchEl).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ isTrainer: true }),
      )
    })
    expect(await screen.findByText(/perfil atualizado com sucesso/i)).toBeInTheDocument()
  })

  it('shows an error message when updateProfile fails', async () => {
    mockUpdateProfile.mockResolvedValue({ success: false, error: 'Erro ao salvar.' })

    render(<ProfilePageClient user={BASE_USER} />)

    await userEvent.click(screen.getByRole('switch', { name: /tornar-se preparador/i }))
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(await screen.findByText('Erro ao salvar.')).toBeInTheDocument()
  })
})
