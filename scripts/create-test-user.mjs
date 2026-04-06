import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kxqcqezhdqgnnpyyyrxd.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ORG_ID = 'd2e21b8a-7e5b-428d-a0bc-11a133f74c7b'
const EMAIL = 'mathiaskracher@gmx.at'
const PASSWORD = '12345678'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Create auth user
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
})

if (authError) {
  console.error('Auth user creation failed:', authError.message)
  process.exit(1)
}

const userId = authData.user.id
console.log('Auth user created:', userId)

// Create profile
const { error: profileError } = await supabase.from('profiles').insert({
  id: userId,
  organization_id: ORG_ID,
  role: 'hv_admin',
  first_name: 'Mathias',
  last_name: 'Kracher',
  is_active: true,
  is_deleted: false,
})

if (profileError) {
  console.error('Profile creation failed:', profileError.message)
  process.exit(1)
}

console.log('Profile created successfully')
console.log('Login: mathiaskracher@gmx.at / 12345678')
