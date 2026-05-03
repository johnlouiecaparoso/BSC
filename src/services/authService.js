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
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName
        }
      }
    })

    if (authError) throw authError

    // Create or update profile (upsert handles the case where
    // the handle_new_user trigger already created the row)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: userData.fullName,
        email: userData.email,
        role: 'office',
        contact_number: null,
        status: 'pending'
      }, { onConflict: 'id' })

    if (profileError) throw profileError

    // Create office
    const { error: officeError } = await supabase
      .from('offices')
      .insert({
        user_id: authData.user.id,
        office_name: userData.officeName,
        pillar: '',
        assignment_type: ''
      })

    if (officeError) throw officeError

    // Sign out immediately (they need approval first)
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
