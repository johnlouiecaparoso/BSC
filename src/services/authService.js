import { supabase } from '@/lib/supabase'

/**
 * Login user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object, role: string}>}
 */
export async function login(email, password) {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    // Check if user is approved
    if (profile.status !== 'approved') {
      await supabase.auth.signOut()
      throw new Error('Your account is pending approval. Please wait for admin approval.')
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: profile.full_name,
        ...profile
      },
      role: profile.role
    }
  } catch (error) {
    throw new Error(error.message || 'Login failed')
  }
}

/**
 * Register new user
 * @param {object} userData - {fullName, email, password, officeName, contactNumber}
 * @returns {Promise<object>}
 */
export async function register(userData) {
  try {
    // The profile and office rows are created by the handle_new_user trigger
    // from this metadata. Doing it server-side keeps registration atomic and
    // works whether or not signUp returns a session — client-side inserts fail
    // RLS when email confirmation is enabled, which used to strand the user
    // with an auth account, no office, and no way to retry.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
          office_name: userData.officeName,
          contact_number: userData.contactNumber || ''
        }
      }
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('Registration failed. Please try again.')
    }

    // Sign out immediately (they need approval first). Harmless when
    // confirmation is enabled and no session was issued.
    await supabase.auth.signOut()

    return {
      success: true,
      message: 'Registration successful. Awaiting admin approval.'
    }
  } catch (error) {
    throw new Error(error.message || 'Registration failed')
  }
}

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current authenticated user
 * @returns {Promise<{user: object|null, role: string|null}>}
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, role: null }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { user: null, role: null }
    }

    // Check if approved
    if (profile.status !== 'approved') {
      await supabase.auth.signOut()
      return { user: null, role: null }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: profile.full_name,
        ...profile
      },
      role: profile.role
    }
  } catch (error) {
    return { user: null, role: null }
  }
}
