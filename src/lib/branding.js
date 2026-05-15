import { supabase } from './supabase'

export async function getCompanyBranding(companyId) {
  const { data, error } = await supabase
    .from('company_branding')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    console.error('Branding error:', error.message)
    return null
  }

  return data
}

export function getDefaultBranding() {
  return {
    company_name: 'Viteka',
    primary_color: '#005643',
    secondary_color: '#0F172A',
    logo_full_color: '/brand/logo-full-color.svg',
    logo_one_color: '/brand/logo-one-color.svg',
    logo_white: '/brand/logo-white.svg',
    logo_icon: '/brand/logo-icon.svg',
    favicon: '/brand/favicon.svg',
  }
}
