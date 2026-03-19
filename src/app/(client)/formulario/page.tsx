'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const FORM_STEPS = [
  { id: 1, title: 'Dados pessoais', description: 'Nome, data de nascimento, estado civil' },
  { id: 2, title: 'Informações de contato', description: 'Endereço, telefone, e-mail' },
  { id: 3, title: 'Passaporte', description: 'Tipo, número, validade' },
  { id: 4, title: 'Viagem', description: 'Propósito, datas, endereço nos EUA' },
  { id: 5, title: 'Situação profissional', description: 'Emprego, renda, educação' },
  { id: 6, title: 'Família', description: 'Pais, cônjuge, filhos' },
  { id: 7, title: 'Viagens anteriores', description: 'Histórico de viagens e vistos' },
  { id: 8, title: 'Questões de segurança', description: 'Perguntas obrigatórias do DS-160' },
]

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

type Child = { name: string; birthdate: string }
type VisitDate = { from: string; to: string; purpose: string }
type SocialPlatform = { name: string; handle: string }
type Companion = { name: string; relationship: string }
type School = { name: string; address: string; city_state: string; zip: string; course: string; start_month_year: string; end_month_year: string }

type FormData = {
  // Step 1
  surname: string
  given_name: string
  other_names: string
  gender: string
  marital_status: string
  birth_date: string
  birth_city: string
  birth_state: string
  birth_country: string
  nationality: string
  cpf: string
  rg: string
  has_other_nationality: boolean
  other_nationality_country: string
  other_nationality_passport: string
  ssn: string
  us_tax_id: string
  other_languages: string
  // Step 2
  address_street: string
  address_number: string
  address_complement: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zip: string
  phone_residential: string
  phone_mobile: string
  phone_commercial: string
  email: string
  visa_delivery_same_address: boolean
  visa_delivery_other_address: string
  // Step 3
  passport_type: string
  passport_number: string
  passport_country: string
  passport_issue_date: string
  passport_expiry_date: string
  passport_issue_city_state: string
  passport_lost: boolean
  passport_lost_info: string
  // Step 4
  travel_purpose: string
  intended_arrival_date: string
  intended_stay_duration: string
  us_address: string
  trip_city: string
  trip_hotel: string
  trip_payer: string
  trip_payer_name: string
  trip_payer_address: string
  trip_payer_phone: string
  trip_payer_email: string
  trip_payer_relationship: string
  intl_travel: string
  travel_companions: Companion[]
  travel_group_agency: string
  // Step 5 (employment_data)
  emp_employer: string
  emp_job_title: string
  emp_salary: string
  emp_employed_since: string
  emp_employer_address: string
  emp_employer_city_state: string
  emp_employer_phone: string
  emp_employer_zip: string
  emp_supervisor: string
  emp_currently_employed: boolean
  emp_prev_employer: string
  emp_prev_address: string
  emp_prev_city_state: string
  emp_prev_phone: string
  emp_prev_zip: string
  emp_prev_job_title: string
  emp_prev_supervisor: string
  emp_prev_start_date: string
  emp_prev_end_date: string
  edu_last_school: string
  edu_field_of_study: string
  edu_graduation_year: string
  edu_education_level: string
  edu_schools: School[]
  // Step 6 (family_data)
  fam_father_name: string
  fam_father_birthdate: string
  fam_father_birthplace: string
  fam_father_nationality: string
  fam_father_in_usa: boolean
  fam_father_usa_status: string
  fam_mother_name: string
  fam_mother_birthdate: string
  fam_mother_birthplace: string
  fam_mother_nationality: string
  fam_mother_in_usa: boolean
  fam_mother_usa_status: string
  rel_in_usa_name: string
  rel_in_usa_relationship: string
  rel_in_usa_status: string
  fam_has_spouse: boolean
  fam_spouse_name: string
  fam_spouse_birthdate: string
  fam_spouse_nationality: string
  fam_spouse_birth_city: string
  fam_divorced: boolean
  ex_spouse_name: string
  ex_spouse_birthdate: string
  ex_spouse_address: string
  ex_marriage_date: string
  ex_divorce_date: string
  ex_divorce_reason: string
  fam_has_children: boolean
  fam_children: Child[]
  // Step 7 (previous_us_travel, social_media, visa_history)
  prev_visited_before: boolean
  prev_last_visit_date: string
  prev_visa_refused: boolean
  prev_refused_reason: string
  prev_visa_cancelled: boolean
  prev_cancel_reason: string
  prev_overstayed: boolean
  prev_visit_dates: VisitDate[]
  had_us_visa: boolean
  us_visa_number: string
  us_visa_type: string
  us_visa_issue_date: string
  us_visa_expiry_date: string
  us_visa_fingerprints: boolean
  us_visa_lost: boolean
  us_visa_lost_when: string
  us_driver_license: boolean
  us_driver_license_number: string
  us_driver_license_state: string
  us_contact_name: string
  us_contact_address: string
  us_contact_phone: string
  us_contact_email: string
  us_contact_relationship: string
  military_served: boolean
  military_country: string
  military_rank: string
  military_period: string
  social_platforms: SocialPlatform[]
  // Step 8 (security_questions)
  sec_q1: boolean | null
  sec_q1_details: string
  sec_q2: boolean | null
  sec_q2_details: string
  sec_q3: boolean | null
  sec_q3_details: string
  sec_q4: boolean | null
  sec_q4_details: string
  sec_q5: boolean | null
  sec_q5_details: string
  sec_q6: boolean | null
  sec_q6_details: string
  sec_q7: boolean | null
  sec_q7_details: string
  sec_q8: boolean | null
  sec_q8_details: string
  sec_q9: boolean | null
  sec_q9_details: string
  sec_q10: boolean | null
  sec_q10_details: string
  sec_q11: boolean | null
  sec_q11_details: string
  sec_q12: boolean | null
  sec_q12_details: string
  sec_q13: boolean | null
  sec_q13_details: string
  sec_q14: boolean | null
  sec_q14_details: string
  sec_q15: boolean | null
  sec_q15_details: string
  sec_q16: boolean | null
  sec_q16_details: string
  form_agreed: boolean
}

const defaultFormData: FormData = {
  // Step 1
  surname: '', given_name: '', other_names: '', gender: '', marital_status: '',
  birth_date: '', birth_city: '', birth_state: '', birth_country: '',
  nationality: 'Brasileira', cpf: '', rg: '',
  has_other_nationality: false, other_nationality_country: '', other_nationality_passport: '',
  ssn: '', us_tax_id: '', other_languages: '',
  // Step 2
  address_street: '', address_number: '', address_complement: '', address_neighborhood: '',
  address_city: '', address_state: '', address_zip: '',
  phone_residential: '', phone_mobile: '', phone_commercial: '', email: '',
  visa_delivery_same_address: true, visa_delivery_other_address: '',
  // Step 3
  passport_type: '', passport_number: '', passport_country: 'Brasil',
  passport_issue_date: '', passport_expiry_date: '',
  passport_issue_city_state: '', passport_lost: false, passport_lost_info: '',
  // Step 4
  travel_purpose: '', intended_arrival_date: '', intended_stay_duration: '',
  us_address: '', trip_city: '', trip_hotel: '', trip_payer: '',
  trip_payer_name: '', trip_payer_address: '', trip_payer_phone: '', trip_payer_email: '', trip_payer_relationship: '',
  intl_travel: '', travel_companions: [], travel_group_agency: '',
  // Step 5
  emp_employer: '', emp_job_title: '', emp_salary: '', emp_employed_since: '', emp_employer_address: '',
  emp_employer_city_state: '', emp_employer_phone: '', emp_employer_zip: '', emp_supervisor: '',
  emp_currently_employed: true,
  emp_prev_employer: '', emp_prev_address: '', emp_prev_city_state: '', emp_prev_phone: '',
  emp_prev_zip: '', emp_prev_job_title: '', emp_prev_supervisor: '', emp_prev_start_date: '', emp_prev_end_date: '',
  edu_last_school: '', edu_field_of_study: '', edu_graduation_year: '', edu_education_level: '',
  edu_schools: [],
  // Step 6
  fam_father_name: '', fam_father_birthdate: '', fam_father_birthplace: '', fam_father_nationality: 'Brasileira',
  fam_father_in_usa: false, fam_father_usa_status: '',
  fam_mother_name: '', fam_mother_birthdate: '', fam_mother_birthplace: '', fam_mother_nationality: 'Brasileira',
  fam_mother_in_usa: false, fam_mother_usa_status: '',
  rel_in_usa_name: '', rel_in_usa_relationship: '', rel_in_usa_status: '',
  fam_has_spouse: false, fam_spouse_name: '',
  fam_spouse_birthdate: '', fam_spouse_nationality: '', fam_spouse_birth_city: '',
  fam_divorced: false,
  ex_spouse_name: '', ex_spouse_birthdate: '', ex_spouse_address: '',
  ex_marriage_date: '', ex_divorce_date: '', ex_divorce_reason: '',
  fam_has_children: false, fam_children: [],
  // Step 7
  prev_visited_before: false, prev_last_visit_date: '',
  prev_visa_refused: false, prev_refused_reason: '',
  prev_visa_cancelled: false, prev_cancel_reason: '',
  prev_overstayed: false, prev_visit_dates: [],
  had_us_visa: false, us_visa_number: '', us_visa_type: '', us_visa_issue_date: '', us_visa_expiry_date: '',
  us_visa_fingerprints: false, us_visa_lost: false, us_visa_lost_when: '',
  us_driver_license: false, us_driver_license_number: '', us_driver_license_state: '',
  us_contact_name: '', us_contact_address: '', us_contact_phone: '', us_contact_email: '', us_contact_relationship: '',
  military_served: false, military_country: '', military_rank: '', military_period: '',
  social_platforms: [],
  // Step 8
  sec_q1: null, sec_q1_details: '',
  sec_q2: null, sec_q2_details: '',
  sec_q3: null, sec_q3_details: '',
  sec_q4: null, sec_q4_details: '',
  sec_q5: null, sec_q5_details: '',
  sec_q6: null, sec_q6_details: '',
  sec_q7: null, sec_q7_details: '',
  sec_q8: null, sec_q8_details: '',
  sec_q9: null, sec_q9_details: '',
  sec_q10: null, sec_q10_details: '',
  sec_q11: null, sec_q11_details: '',
  sec_q12: null, sec_q12_details: '',
  sec_q13: null, sec_q13_details: '',
  sec_q14: null, sec_q14_details: '',
  sec_q15: null, sec_q15_details: '',
  sec_q16: null, sec_q16_details: '',
  form_agreed: false,
}

function inputClass() {
  return 'w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900'
}

export default function FormularioPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [applicantId, setApplicantId] = useState<string | null>(null)
  const [processId, setProcessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const progress = ((currentStep - 1) / (FORM_STEPS.length - 1)) * 100

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Load existing applicant data on mount
  useEffect(() => {
    const loadApplicant = async () => {
      try {
        const res = await fetch('/api/applicants')
        if (!res.ok) return
        const { applicant, processId: pid } = await res.json()
        setApplicantId(applicant.id)
        setProcessId(pid)

        // Populate form data from applicant
        const merged: Partial<FormData> = {
          // Step 1
          surname: applicant.surname || '',
          given_name: applicant.given_name || '',
          other_names: applicant.other_names || '',
          gender: applicant.gender || '',
          marital_status: applicant.marital_status || '',
          birth_date: applicant.birth_date || '',
          birth_city: applicant.birth_city || '',
          birth_state: applicant.birth_state || '',
          birth_country: applicant.birth_country || '',
          nationality: applicant.nationality || 'Brasileira',
          cpf: applicant.cpf || '',
          rg: applicant.rg || '',
          has_other_nationality: applicant.has_other_nationality || false,
          other_nationality_country: applicant.other_nationality_country || '',
          other_nationality_passport: applicant.other_nationality_passport || '',
          ssn: applicant.ssn || '',
          us_tax_id: applicant.us_tax_id || '',
          other_languages: applicant.other_languages || '',
          // Step 2
          address_street: applicant.address_street || '',
          address_number: applicant.address_number || '',
          address_complement: applicant.address_complement || '',
          address_neighborhood: applicant.address_neighborhood || '',
          address_city: applicant.address_city || '',
          address_state: applicant.address_state || '',
          address_zip: applicant.address_zip || '',
          phone_residential: applicant.phone_residential || '',
          phone_mobile: applicant.phone_mobile || '',
          phone_commercial: applicant.phone_commercial || '',
          email: applicant.email || '',
          visa_delivery_same_address: applicant.visa_delivery_same_address !== undefined ? applicant.visa_delivery_same_address : true,
          visa_delivery_other_address: applicant.visa_delivery_other_address || '',
          // Step 3
          passport_type: applicant.passport_type || '',
          passport_number: applicant.passport_number || '',
          passport_country: applicant.passport_country || 'Brasil',
          passport_issue_date: applicant.passport_issue_date || '',
          passport_expiry_date: applicant.passport_expiry_date || '',
          passport_issue_city_state: applicant.passport_issue_city_state || '',
          passport_lost: applicant.passport_lost || false,
          passport_lost_info: applicant.passport_lost_info || '',
          // Step 4
          travel_purpose: applicant.travel_purpose || '',
          intended_arrival_date: applicant.intended_arrival_date || '',
          intended_stay_duration: applicant.intended_stay_duration || '',
          us_address: applicant.us_address || '',
          trip_city: applicant.trip_city || '',
          trip_hotel: applicant.trip_hotel || '',
          trip_payer: applicant.trip_payer || '',
          trip_payer_name: applicant.trip_payer_name || '',
          trip_payer_address: applicant.trip_payer_address || '',
          trip_payer_phone: applicant.trip_payer_phone || '',
          trip_payer_email: applicant.trip_payer_email || '',
          trip_payer_relationship: applicant.trip_payer_relationship || '',
          intl_travel: applicant.intl_travel || '',
          travel_companions: applicant.travel_companions || [],
          travel_group_agency: applicant.travel_group_agency || '',
        }

        // Employment data
        const emp = applicant.employment_data || {}
        merged.emp_employer = emp.employer || ''
        merged.emp_job_title = emp.job_title || ''
        merged.emp_salary = emp.salary || ''
        merged.emp_employed_since = emp.employed_since || ''
        merged.emp_employer_address = emp.employer_address || ''
        merged.emp_employer_city_state = emp.employer_city_state || ''
        merged.emp_employer_phone = emp.employer_phone || ''
        merged.emp_employer_zip = emp.employer_zip || ''
        merged.emp_supervisor = emp.supervisor || ''
        merged.emp_currently_employed = emp.currently_employed !== undefined ? emp.currently_employed : true
        merged.emp_prev_employer = emp.prev_employer || ''
        merged.emp_prev_address = emp.prev_address || ''
        merged.emp_prev_city_state = emp.prev_city_state || ''
        merged.emp_prev_phone = emp.prev_phone || ''
        merged.emp_prev_zip = emp.prev_zip || ''
        merged.emp_prev_job_title = emp.prev_job_title || ''
        merged.emp_prev_supervisor = emp.prev_supervisor || ''
        merged.emp_prev_start_date = emp.prev_start_date || ''
        merged.emp_prev_end_date = emp.prev_end_date || ''

        // Education data
        const edu = applicant.education_data || {}
        merged.edu_last_school = edu.last_school || ''
        merged.edu_field_of_study = edu.field_of_study || ''
        merged.edu_graduation_year = edu.graduation_year || ''
        merged.edu_education_level = edu.education_level || ''
        merged.edu_schools = edu.schools || []

        // Family data
        const fam = applicant.family_data || {}
        merged.fam_father_name = fam.father_name || ''
        merged.fam_father_birthdate = fam.father_birthdate || ''
        merged.fam_father_birthplace = fam.father_birthplace || ''
        merged.fam_father_nationality = fam.father_nationality || 'Brasileira'
        merged.fam_father_in_usa = fam.father_in_usa || false
        merged.fam_father_usa_status = fam.father_usa_status || ''
        merged.fam_mother_name = fam.mother_name || ''
        merged.fam_mother_birthdate = fam.mother_birthdate || ''
        merged.fam_mother_birthplace = fam.mother_birthplace || ''
        merged.fam_mother_nationality = fam.mother_nationality || 'Brasileira'
        merged.fam_mother_in_usa = fam.mother_in_usa || false
        merged.fam_mother_usa_status = fam.mother_usa_status || ''
        merged.rel_in_usa_name = fam.rel_in_usa_name || ''
        merged.rel_in_usa_relationship = fam.rel_in_usa_relationship || ''
        merged.rel_in_usa_status = fam.rel_in_usa_status || ''
        merged.fam_has_spouse = fam.has_spouse || false
        merged.fam_spouse_name = fam.spouse_name || ''
        merged.fam_spouse_birthdate = fam.spouse_birthdate || ''
        merged.fam_spouse_nationality = fam.spouse_nationality || ''
        merged.fam_spouse_birth_city = fam.spouse_birth_city || ''
        merged.fam_divorced = fam.divorced || false
        merged.ex_spouse_name = fam.ex_spouse_name || ''
        merged.ex_spouse_birthdate = fam.ex_spouse_birthdate || ''
        merged.ex_spouse_address = fam.ex_spouse_address || ''
        merged.ex_marriage_date = fam.ex_marriage_date || ''
        merged.ex_divorce_date = fam.ex_divorce_date || ''
        merged.ex_divorce_reason = fam.ex_divorce_reason || ''
        merged.fam_has_children = fam.has_children || false
        merged.fam_children = fam.children || []

        // Previous travel + visa history
        const prev = applicant.previous_us_travel || {}
        merged.prev_visited_before = prev.visited_before || false
        merged.prev_last_visit_date = prev.last_visit_date || ''
        merged.prev_visa_refused = prev.visa_refused || false
        merged.prev_refused_reason = prev.refused_reason || ''
        merged.prev_visa_cancelled = prev.visa_cancelled || false
        merged.prev_cancel_reason = prev.cancel_reason || ''
        merged.prev_overstayed = prev.overstayed || false
        merged.prev_visit_dates = prev.visit_dates || []
        merged.had_us_visa = prev.had_us_visa || false
        merged.us_visa_number = prev.us_visa_number || ''
        merged.us_visa_type = prev.us_visa_type || ''
        merged.us_visa_issue_date = prev.us_visa_issue_date || ''
        merged.us_visa_expiry_date = prev.us_visa_expiry_date || ''
        merged.us_visa_fingerprints = prev.us_visa_fingerprints || false
        merged.us_visa_lost = prev.us_visa_lost || false
        merged.us_visa_lost_when = prev.us_visa_lost_when || ''
        merged.us_driver_license = prev.us_driver_license || false
        merged.us_driver_license_number = prev.us_driver_license_number || ''
        merged.us_driver_license_state = prev.us_driver_license_state || ''
        merged.us_contact_name = prev.us_contact_name || ''
        merged.us_contact_address = prev.us_contact_address || ''
        merged.us_contact_phone = prev.us_contact_phone || ''
        merged.us_contact_email = prev.us_contact_email || ''
        merged.us_contact_relationship = prev.us_contact_relationship || ''
        merged.military_served = prev.military_served || false
        merged.military_country = prev.military_country || ''
        merged.military_rank = prev.military_rank || ''
        merged.military_period = prev.military_period || ''

        // Social media
        const social = applicant.social_media || {}
        merged.social_platforms = social.platforms || []

        // Security questions
        const sec = applicant.security_questions || {}
        for (let i = 1; i <= 16; i++) {
          const k = `q${i}` as keyof typeof sec
          const dk = `q${i}_details` as keyof typeof sec
          ;(merged as Record<string, unknown>)[`sec_q${i}`] = sec[k] !== undefined ? sec[k] : null
          ;(merged as Record<string, unknown>)[`sec_q${i}_details`] = (sec[dk] as string) || ''
        }

        setFormData((prev) => ({ ...prev, ...merged }))

        // Resume from last saved step
        if (applicant.form_step && applicant.form_step > 1) {
          setCurrentStep(Math.min(applicant.form_step, FORM_STEPS.length))
        }
      } catch (err) {
        console.error('Error loading applicant:', err)
      } finally {
        setLoading(false)
      }
    }

    loadApplicant()
  }, [])

  const buildStepPayload = (step: number) => {
    switch (step) {
      case 1:
        return {
          surname: formData.surname,
          given_name: formData.given_name,
          other_names: formData.other_names,
          gender: formData.gender,
          marital_status: formData.marital_status,
          birth_date: formData.birth_date,
          birth_city: formData.birth_city,
          birth_state: formData.birth_state,
          birth_country: formData.birth_country,
          nationality: formData.nationality,
          cpf: formData.cpf,
          rg: formData.rg,
          has_other_nationality: formData.has_other_nationality,
          other_nationality_country: formData.has_other_nationality ? formData.other_nationality_country : '',
          other_nationality_passport: formData.has_other_nationality ? formData.other_nationality_passport : '',
          ssn: formData.ssn,
          us_tax_id: formData.us_tax_id,
          other_languages: formData.other_languages,
          form_step: 1,
        }
      case 2:
        return {
          address_street: formData.address_street,
          address_number: formData.address_number,
          address_complement: formData.address_complement,
          address_neighborhood: formData.address_neighborhood,
          address_city: formData.address_city,
          address_state: formData.address_state,
          address_zip: formData.address_zip,
          phone_residential: formData.phone_residential,
          phone_mobile: formData.phone_mobile,
          phone_commercial: formData.phone_commercial,
          email: formData.email,
          visa_delivery_same_address: formData.visa_delivery_same_address,
          visa_delivery_other_address: formData.visa_delivery_same_address ? '' : formData.visa_delivery_other_address,
          form_step: 2,
        }
      case 3:
        return {
          passport_type: formData.passport_type,
          passport_number: formData.passport_number,
          passport_country: formData.passport_country,
          passport_issue_date: formData.passport_issue_date,
          passport_expiry_date: formData.passport_expiry_date,
          passport_issue_city_state: formData.passport_issue_city_state,
          passport_lost: formData.passport_lost,
          passport_lost_info: formData.passport_lost ? formData.passport_lost_info : '',
          form_step: 3,
        }
      case 4:
        return {
          travel_purpose: formData.travel_purpose,
          intended_arrival_date: formData.intended_arrival_date,
          intended_stay_duration: formData.intended_stay_duration,
          us_address: formData.us_address,
          trip_city: formData.trip_city,
          trip_hotel: formData.trip_hotel,
          trip_payer: formData.trip_payer,
          trip_payer_name: formData.trip_payer !== 'self' ? formData.trip_payer_name : '',
          trip_payer_address: formData.trip_payer !== 'self' ? formData.trip_payer_address : '',
          trip_payer_phone: formData.trip_payer !== 'self' ? formData.trip_payer_phone : '',
          trip_payer_email: formData.trip_payer !== 'self' ? formData.trip_payer_email : '',
          trip_payer_relationship: formData.trip_payer !== 'self' ? formData.trip_payer_relationship : '',
          intl_travel: formData.intl_travel,
          travel_companions: formData.travel_companions,
          travel_group_agency: formData.travel_group_agency,
          form_step: 4,
        }
      case 5:
        return {
          employment_data: {
            employer: formData.emp_employer,
            job_title: formData.emp_job_title,
            salary: formData.emp_salary,
            employed_since: formData.emp_employed_since,
            employer_address: formData.emp_employer_address,
            employer_city_state: formData.emp_employer_city_state,
            employer_phone: formData.emp_employer_phone,
            employer_zip: formData.emp_employer_zip,
            supervisor: formData.emp_supervisor,
            currently_employed: formData.emp_currently_employed,
            prev_employer: formData.emp_prev_employer,
            prev_address: formData.emp_prev_address,
            prev_city_state: formData.emp_prev_city_state,
            prev_phone: formData.emp_prev_phone,
            prev_zip: formData.emp_prev_zip,
            prev_job_title: formData.emp_prev_job_title,
            prev_supervisor: formData.emp_prev_supervisor,
            prev_start_date: formData.emp_prev_start_date,
            prev_end_date: formData.emp_prev_end_date,
          },
          education_data: {
            last_school: formData.edu_last_school,
            field_of_study: formData.edu_field_of_study,
            graduation_year: formData.edu_graduation_year,
            education_level: formData.edu_education_level,
            schools: formData.edu_schools,
          },
          form_step: 5,
        }
      case 6:
        return {
          family_data: {
            father_name: formData.fam_father_name,
            father_birthdate: formData.fam_father_birthdate,
            father_birthplace: formData.fam_father_birthplace,
            father_nationality: formData.fam_father_nationality,
            father_in_usa: formData.fam_father_in_usa,
            father_usa_status: formData.fam_father_in_usa ? formData.fam_father_usa_status : '',
            mother_name: formData.fam_mother_name,
            mother_birthdate: formData.fam_mother_birthdate,
            mother_birthplace: formData.fam_mother_birthplace,
            mother_nationality: formData.fam_mother_nationality,
            mother_in_usa: formData.fam_mother_in_usa,
            mother_usa_status: formData.fam_mother_in_usa ? formData.fam_mother_usa_status : '',
            rel_in_usa_name: formData.rel_in_usa_name,
            rel_in_usa_relationship: formData.rel_in_usa_relationship,
            rel_in_usa_status: formData.rel_in_usa_status,
            has_spouse: formData.fam_has_spouse,
            spouse_name: formData.fam_has_spouse ? formData.fam_spouse_name : '',
            spouse_birthdate: formData.fam_has_spouse ? formData.fam_spouse_birthdate : '',
            spouse_nationality: formData.fam_has_spouse ? formData.fam_spouse_nationality : '',
            spouse_birth_city: formData.fam_has_spouse ? formData.fam_spouse_birth_city : '',
            divorced: formData.fam_divorced,
            ex_spouse_name: formData.fam_divorced ? formData.ex_spouse_name : '',
            ex_spouse_birthdate: formData.fam_divorced ? formData.ex_spouse_birthdate : '',
            ex_spouse_address: formData.fam_divorced ? formData.ex_spouse_address : '',
            ex_marriage_date: formData.fam_divorced ? formData.ex_marriage_date : '',
            ex_divorce_date: formData.fam_divorced ? formData.ex_divorce_date : '',
            ex_divorce_reason: formData.fam_divorced ? formData.ex_divorce_reason : '',
            has_children: formData.fam_has_children,
            children: formData.fam_has_children ? formData.fam_children : [],
          },
          form_step: 6,
        }
      case 7:
        return {
          previous_us_travel: {
            visited_before: formData.prev_visited_before,
            last_visit_date: formData.prev_visited_before ? formData.prev_last_visit_date : '',
            visit_dates: formData.prev_visited_before ? formData.prev_visit_dates : [],
            visa_refused: formData.prev_visa_refused,
            refused_reason: formData.prev_visa_refused ? formData.prev_refused_reason : '',
            visa_cancelled: formData.prev_visa_cancelled,
            cancel_reason: formData.prev_visa_cancelled ? formData.prev_cancel_reason : '',
            overstayed: formData.prev_overstayed,
            had_us_visa: formData.had_us_visa,
            us_visa_number: formData.had_us_visa ? formData.us_visa_number : '',
            us_visa_type: formData.had_us_visa ? formData.us_visa_type : '',
            us_visa_issue_date: formData.had_us_visa ? formData.us_visa_issue_date : '',
            us_visa_expiry_date: formData.had_us_visa ? formData.us_visa_expiry_date : '',
            us_visa_fingerprints: formData.us_visa_fingerprints,
            us_visa_lost: formData.us_visa_lost,
            us_visa_lost_when: formData.us_visa_lost ? formData.us_visa_lost_when : '',
            us_driver_license: formData.us_driver_license,
            us_driver_license_number: formData.us_driver_license ? formData.us_driver_license_number : '',
            us_driver_license_state: formData.us_driver_license ? formData.us_driver_license_state : '',
            us_contact_name: formData.us_contact_name,
            us_contact_address: formData.us_contact_address,
            us_contact_phone: formData.us_contact_phone,
            us_contact_email: formData.us_contact_email,
            us_contact_relationship: formData.us_contact_relationship,
            military_served: formData.military_served,
            military_country: formData.military_served ? formData.military_country : '',
            military_rank: formData.military_served ? formData.military_rank : '',
            military_period: formData.military_served ? formData.military_period : '',
          },
          social_media: {
            platforms: formData.social_platforms,
          },
          form_step: 7,
        }
      case 8:
        return {
          security_questions: {
            q1: formData.sec_q1, q1_details: formData.sec_q1 ? formData.sec_q1_details : '',
            q2: formData.sec_q2, q2_details: formData.sec_q2 ? formData.sec_q2_details : '',
            q3: formData.sec_q3, q3_details: formData.sec_q3 ? formData.sec_q3_details : '',
            q4: formData.sec_q4, q4_details: formData.sec_q4 ? formData.sec_q4_details : '',
            q5: formData.sec_q5, q5_details: formData.sec_q5 ? formData.sec_q5_details : '',
            q6: formData.sec_q6, q6_details: formData.sec_q6 ? formData.sec_q6_details : '',
            q7: formData.sec_q7, q7_details: formData.sec_q7 ? formData.sec_q7_details : '',
            q8: formData.sec_q8, q8_details: formData.sec_q8 ? formData.sec_q8_details : '',
            q9: formData.sec_q9, q9_details: formData.sec_q9 ? formData.sec_q9_details : '',
            q10: formData.sec_q10, q10_details: formData.sec_q10 ? formData.sec_q10_details : '',
            q11: formData.sec_q11, q11_details: formData.sec_q11 ? formData.sec_q11_details : '',
            q12: formData.sec_q12, q12_details: formData.sec_q12 ? formData.sec_q12_details : '',
            q13: formData.sec_q13, q13_details: formData.sec_q13 ? formData.sec_q13_details : '',
            q14: formData.sec_q14, q14_details: formData.sec_q14 ? formData.sec_q14_details : '',
            q15: formData.sec_q15, q15_details: formData.sec_q15 ? formData.sec_q15_details : '',
            q16: formData.sec_q16, q16_details: formData.sec_q16 ? formData.sec_q16_details : '',
          },
          form_step: 8,
          form_completed_at: new Date().toISOString(),
        }
      default:
        return {}
    }
  }

  const saveStep = async (step: number): Promise<boolean> => {
    if (!applicantId) return true // No applicant yet, skip save
    setSaving(true)
    setSaveError(null)
    try {
      const payload = buildStepPayload(step)
      const res = await fetch('/api/applicants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: applicantId, ...payload }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }
      return true
    } catch (err) {
      console.error('Save error:', err)
      setSaveError('Erro ao salvar. Verifique sua conexão e tente novamente.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    const saved = await saveStep(currentStep)
    if (!saved) return

    if (currentStep === FORM_STEPS.length) {
      // Final step — update process status and redirect
      if (processId) {
        try {
          await fetch(`/api/admin/processes/${processId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'form_completed' }),
          })
        } catch (err) {
          console.error('Error updating process status:', err)
        }
      }
      router.push('/dashboard')
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando formulário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900">Formulário DS-160</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Formulário DS-160</h1>
        <p className="text-slate-600">Preencha com calma — você pode salvar e continuar depois.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Etapas</p>
            <nav className="space-y-1">
              {FORM_STEPS.map((step) => {
                const isDone = step.id < currentStep
                const isCurrent = step.id === currentStep
                return (
                  <button
                    key={step.id}
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                      isCurrent ? 'bg-blue-50 text-blue-700' :
                      isDone ? 'text-green-700 hover:bg-green-50' :
                      'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isDone ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-blue-700 text-white' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? '✓' : step.id}
                    </div>
                    <span className="font-medium truncate">{step.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3">
          {/* Progress Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">
                Etapa {currentStep} de {FORM_STEPS.length}: {FORM_STEPS[currentStep - 1].title}
              </span>
              <span className="text-sm text-slate-500">{Math.round(progress)}% completo</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{FORM_STEPS[currentStep - 1].description}</p>
          </div>

          {saveError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {saveError}
            </div>
          )}

          {/* Dynamic Step Content */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            {/* STEP 1 — Dados Pessoais */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Dados pessoais</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sobrenome (como no passaporte) *</label>
                    <input
                      type="text"
                      value={formData.surname}
                      onChange={(e) => updateField('surname', e.target.value)}
                      className={inputClass()}
                      placeholder="SILVA"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome(s) (como no passaporte) *</label>
                    <input
                      type="text"
                      value={formData.given_name}
                      onChange={(e) => updateField('given_name', e.target.value)}
                      className={inputClass()}
                      placeholder="JOAO CARLOS"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Outros nomes (apelido, nome anterior)</label>
                    <input
                      type="text"
                      value={formData.other_names}
                      onChange={(e) => updateField('other_names', e.target.value)}
                      className={inputClass()}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data de nascimento *</label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => updateField('birth_date', e.target.value)}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sexo *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estado civil *</label>
                    <select
                      value={formData.marital_status}
                      onChange={(e) => updateField('marital_status', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Selecione</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_estavel">União estável</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">País de nascimento *</label>
                    <input
                      type="text"
                      value={formData.birth_country}
                      onChange={(e) => updateField('birth_country', e.target.value)}
                      className={inputClass()}
                      placeholder="Brasil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cidade de nascimento *</label>
                    <input
                      type="text"
                      value={formData.birth_city}
                      onChange={(e) => updateField('birth_city', e.target.value)}
                      className={inputClass()}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estado de nascimento</label>
                    <select
                      value={formData.birth_state}
                      onChange={(e) => updateField('birth_state', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Selecione</option>
                      {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Contato */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Informações de contato</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Logradouro *</label>
                    <input
                      type="text"
                      value={formData.address_street}
                      onChange={(e) => updateField('address_street', e.target.value)}
                      className={inputClass()}
                      placeholder="Rua das Flores"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Número *</label>
                    <input
                      type="text"
                      value={formData.address_number}
                      onChange={(e) => updateField('address_number', e.target.value)}
                      className={inputClass()}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Complemento</label>
                    <input
                      type="text"
                      value={formData.address_complement}
                      onChange={(e) => updateField('address_complement', e.target.value)}
                      className={inputClass()}
                      placeholder="Apto 45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Bairro *</label>
                    <input
                      type="text"
                      value={formData.address_neighborhood}
                      onChange={(e) => updateField('address_neighborhood', e.target.value)}
                      className={inputClass()}
                      placeholder="Centro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cidade *</label>
                    <input
                      type="text"
                      value={formData.address_city}
                      onChange={(e) => updateField('address_city', e.target.value)}
                      className={inputClass()}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estado (UF) *</label>
                    <select
                      value={formData.address_state}
                      onChange={(e) => updateField('address_state', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Selecione</option>
                      {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">CEP *</label>
                    <input
                      type="text"
                      value={formData.address_zip}
                      onChange={(e) => updateField('address_zip', e.target.value)}
                      className={inputClass()}
                      placeholder="01310-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone residencial</label>
                    <input
                      type="tel"
                      value={formData.phone_residential}
                      onChange={(e) => updateField('phone_residential', e.target.value)}
                      className={inputClass()}
                      placeholder="(11) 3456-7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Celular *</label>
                    <input
                      type="tel"
                      value={formData.phone_mobile}
                      onChange={(e) => updateField('phone_mobile', e.target.value)}
                      className={inputClass()}
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={inputClass()}
                      placeholder="joao@email.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Passaporte */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Passaporte</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de passaporte *</label>
                    <select
                      value={formData.passport_type}
                      onChange={(e) => updateField('passport_type', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Selecione</option>
                      <option value="regular">Regular</option>
                      <option value="diplomatic">Diplomático</option>
                      <option value="official">Oficial</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Número do passaporte *</label>
                    <input
                      type="text"
                      value={formData.passport_number}
                      onChange={(e) => updateField('passport_number', e.target.value.toUpperCase())}
                      className={inputClass()}
                      placeholder="AA123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">País emissor *</label>
                    <input
                      type="text"
                      value={formData.passport_country}
                      onChange={(e) => updateField('passport_country', e.target.value)}
                      className={inputClass()}
                      placeholder="Brasil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data de emissão *</label>
                    <input
                      type="date"
                      value={formData.passport_issue_date}
                      onChange={(e) => updateField('passport_issue_date', e.target.value)}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data de validade *</label>
                    <input
                      type="date"
                      value={formData.passport_expiry_date}
                      onChange={(e) => updateField('passport_expiry_date', e.target.value)}
                      className={inputClass()}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 — Viagem */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Informações da viagem</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Propósito da viagem *</label>
                    <select
                      value={formData.travel_purpose}
                      onChange={(e) => updateField('travel_purpose', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Selecione</option>
                      <option value="tourism">Turismo</option>
                      <option value="business">Negócios</option>
                      <option value="study">Estudo</option>
                      <option value="medical">Tratamento médico</option>
                      <option value="transit">Trânsito</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data pretendida de chegada</label>
                    <input
                      type="date"
                      value={formData.intended_arrival_date}
                      onChange={(e) => updateField('intended_arrival_date', e.target.value)}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duração pretendida da estadia</label>
                    <input
                      type="text"
                      value={formData.intended_stay_duration}
                      onChange={(e) => updateField('intended_stay_duration', e.target.value)}
                      className={inputClass()}
                      placeholder="Ex: 30 dias"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Endereço nos EUA onde ficará *</label>
                    <textarea
                      value={formData.us_address}
                      onChange={(e) => updateField('us_address', e.target.value)}
                      className={`${inputClass()} min-h-[80px] resize-y`}
                      placeholder="Nome do hotel ou endereço completo onde ficará hospedado"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Quem pagará pela viagem? *</label>
                    <select
                      value={formData.trip_payer}
                      onChange={(e) => updateField('trip_payer', e.target.value)}
                      className={inputClass()}
                    >
                      <option value="">Selecione</option>
                      <option value="self">Eu mesmo</option>
                      <option value="company">Empresa</option>
                      <option value="relative">Familiar/Parente</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 — Situação Profissional */}
            {currentStep === 5 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Situação profissional</h2>
                  <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emp_currently_employed}
                        onChange={(e) => updateField('emp_currently_employed', e.target.checked)}
                        className="accent-blue-700 w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-slate-700">Estou atualmente empregado</span>
                    </label>
                  </div>
                  {formData.emp_currently_employed && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Empresa / Empregador</label>
                        <input
                          type="text"
                          value={formData.emp_employer}
                          onChange={(e) => updateField('emp_employer', e.target.value)}
                          className={inputClass()}
                          placeholder="Nome da empresa"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Cargo / Função</label>
                        <input
                          type="text"
                          value={formData.emp_job_title}
                          onChange={(e) => updateField('emp_job_title', e.target.value)}
                          className={inputClass()}
                          placeholder="Analista de sistemas"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Salário mensal (R$)</label>
                        <input
                          type="text"
                          value={formData.emp_salary}
                          onChange={(e) => updateField('emp_salary', e.target.value)}
                          className={inputClass()}
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Empregado desde</label>
                        <input
                          type="date"
                          value={formData.emp_employed_since}
                          onChange={(e) => updateField('emp_employed_since', e.target.value)}
                          className={inputClass()}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Endereço do empregador</label>
                        <input
                          type="text"
                          value={formData.emp_employer_address}
                          onChange={(e) => updateField('emp_employer_address', e.target.value)}
                          className={inputClass()}
                          placeholder="Rua, número, cidade, estado"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Educação</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nível de escolaridade</label>
                      <select
                        value={formData.edu_education_level}
                        onChange={(e) => updateField('edu_education_level', e.target.value)}
                        className={inputClass()}
                      >
                        <option value="">Selecione</option>
                        <option value="ensino_medio">Ensino Médio</option>
                        <option value="graduacao">Graduação</option>
                        <option value="pos_graduacao">Pós-Graduação</option>
                        <option value="mestrado">Mestrado</option>
                        <option value="doutorado">Doutorado</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Última escola/universidade</label>
                      <input
                        type="text"
                        value={formData.edu_last_school}
                        onChange={(e) => updateField('edu_last_school', e.target.value)}
                        className={inputClass()}
                        placeholder="Nome da instituição"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Curso / Área de estudo</label>
                      <input
                        type="text"
                        value={formData.edu_field_of_study}
                        onChange={(e) => updateField('edu_field_of_study', e.target.value)}
                        className={inputClass()}
                        placeholder="Engenharia de Computação"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Ano de conclusão</label>
                      <input
                        type="text"
                        value={formData.edu_graduation_year}
                        onChange={(e) => updateField('edu_graduation_year', e.target.value)}
                        className={inputClass()}
                        placeholder="2015"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6 — Família */}
            {currentStep === 6 && (
              <div className="space-y-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Informações familiares</h2>

                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-4">Pai</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo do pai</label>
                      <input type="text" value={formData.fam_father_name} onChange={(e) => updateField('fam_father_name', e.target.value)} className={inputClass()} placeholder="Nome do pai" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Data de nascimento</label>
                      <input type="date" value={formData.fam_father_birthdate} onChange={(e) => updateField('fam_father_birthdate', e.target.value)} className={inputClass()} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Local de nascimento</label>
                      <input type="text" value={formData.fam_father_birthplace} onChange={(e) => updateField('fam_father_birthplace', e.target.value)} className={inputClass()} placeholder="Cidade, País" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nacionalidade</label>
                      <input type="text" value={formData.fam_father_nationality} onChange={(e) => updateField('fam_father_nationality', e.target.value)} className={inputClass()} placeholder="Brasileira" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-base font-semibold text-slate-800 mb-4">Mãe</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo da mãe</label>
                      <input type="text" value={formData.fam_mother_name} onChange={(e) => updateField('fam_mother_name', e.target.value)} className={inputClass()} placeholder="Nome da mãe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Data de nascimento</label>
                      <input type="date" value={formData.fam_mother_birthdate} onChange={(e) => updateField('fam_mother_birthdate', e.target.value)} className={inputClass()} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Local de nascimento</label>
                      <input type="text" value={formData.fam_mother_birthplace} onChange={(e) => updateField('fam_mother_birthplace', e.target.value)} className={inputClass()} placeholder="Cidade, País" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nacionalidade</label>
                      <input type="text" value={formData.fam_mother_nationality} onChange={(e) => updateField('fam_mother_nationality', e.target.value)} className={inputClass()} placeholder="Brasileira" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.fam_has_spouse}
                      onChange={(e) => updateField('fam_has_spouse', e.target.checked)}
                      className="accent-blue-700 w-4 h-4"
                    />
                    <span className="text-base font-semibold text-slate-800">Tenho cônjuge / companheiro(a)</span>
                  </label>
                  {formData.fam_has_spouse && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo do cônjuge</label>
                      <input
                        type="text"
                        value={formData.fam_spouse_name}
                        onChange={(e) => updateField('fam_spouse_name', e.target.value)}
                        className={inputClass()}
                        placeholder="Nome completo"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.fam_has_children}
                      onChange={(e) => updateField('fam_has_children', e.target.checked)}
                      className="accent-blue-700 w-4 h-4"
                    />
                    <span className="text-base font-semibold text-slate-800">Tenho filhos</span>
                  </label>
                  {formData.fam_has_children && (
                    <div className="space-y-3">
                      {formData.fam_children.map((child, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) => {
                                const updated = [...formData.fam_children]
                                updated[idx] = { ...updated[idx], name: e.target.value }
                                updateField('fam_children', updated)
                              }}
                              className={inputClass()}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Data de nascimento</label>
                            <input
                              type="date"
                              value={child.birthdate}
                              onChange={(e) => {
                                const updated = [...formData.fam_children]
                                updated[idx] = { ...updated[idx], birthdate: e.target.value }
                                updateField('fam_children', updated)
                              }}
                              className={inputClass()}
                            />
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.fam_children.filter((_, i) => i !== idx)
                                updateField('fam_children', updated)
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold"
                            >
                              Remover filho
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateField('fam_children', [...formData.fam_children, { name: '', birthdate: '' }])}
                        className="text-sm text-blue-700 font-semibold hover:underline"
                      >
                        + Adicionar filho
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 7 — Viagens anteriores */}
            {currentStep === 7 && (
              <div className="space-y-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Viagens anteriores aos EUA</h2>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.prev_visited_before}
                      onChange={(e) => updateField('prev_visited_before', e.target.checked)}
                      className="accent-blue-700 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Já visitei os EUA anteriormente</span>
                  </label>

                  {formData.prev_visited_before && (
                    <div className="space-y-4 pl-7">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Data da última visita</label>
                        <input
                          type="date"
                          value={formData.prev_last_visit_date}
                          onChange={(e) => updateField('prev_last_visit_date', e.target.value)}
                          className={inputClass()}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Períodos de visita</p>
                        <div className="space-y-3">
                          {formData.prev_visit_dates.map((visit, idx) => (
                            <div key={idx} className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">De</label>
                                <input
                                  type="date"
                                  value={visit.from}
                                  onChange={(e) => {
                                    const updated = [...formData.prev_visit_dates]
                                    updated[idx] = { ...updated[idx], from: e.target.value }
                                    updateField('prev_visit_dates', updated)
                                  }}
                                  className={inputClass()}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Até</label>
                                <input
                                  type="date"
                                  value={visit.to}
                                  onChange={(e) => {
                                    const updated = [...formData.prev_visit_dates]
                                    updated[idx] = { ...updated[idx], to: e.target.value }
                                    updateField('prev_visit_dates', updated)
                                  }}
                                  className={inputClass()}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Motivo</label>
                                <input
                                  type="text"
                                  value={visit.purpose}
                                  onChange={(e) => {
                                    const updated = [...formData.prev_visit_dates]
                                    updated[idx] = { ...updated[idx], purpose: e.target.value }
                                    updateField('prev_visit_dates', updated)
                                  }}
                                  className={inputClass()}
                                  placeholder="Turismo"
                                />
                              </div>
                              <div className="col-span-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = formData.prev_visit_dates.filter((_, i) => i !== idx)
                                    updateField('prev_visit_dates', updated)
                                  }}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => updateField('prev_visit_dates', [...formData.prev_visit_dates, { from: '', to: '', purpose: '' }])}
                            className="text-sm text-blue-700 font-semibold hover:underline"
                          >
                            + Adicionar período
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prev_visa_refused}
                      onChange={(e) => updateField('prev_visa_refused', e.target.checked)}
                      className="accent-blue-700 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Já tive visto negado ou entrada recusada nos EUA</span>
                  </label>
                  {formData.prev_visa_refused && (
                    <div className="pl-7">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Explique o motivo</label>
                      <textarea
                        value={formData.prev_refused_reason}
                        onChange={(e) => updateField('prev_refused_reason', e.target.value)}
                        className={`${inputClass()} min-h-[80px] resize-y`}
                        placeholder="Descreva quando e por qual motivo o visto foi negado"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prev_visa_cancelled}
                      onChange={(e) => updateField('prev_visa_cancelled', e.target.checked)}
                      className="accent-blue-700 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Já tive um visto americano cancelado</span>
                  </label>
                  {formData.prev_visa_cancelled && (
                    <div className="pl-7">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Explique o motivo</label>
                      <textarea
                        value={formData.prev_cancel_reason}
                        onChange={(e) => updateField('prev_cancel_reason', e.target.value)}
                        className={`${inputClass()} min-h-[80px] resize-y`}
                        placeholder="Descreva quando e por qual motivo o visto foi cancelado"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prev_overstayed}
                      onChange={(e) => updateField('prev_overstayed', e.target.checked)}
                      className="accent-blue-700 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Já permaneci nos EUA além do prazo autorizado</span>
                  </label>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-base font-semibold text-slate-800 mb-2">Redes sociais</h3>
                  <p className="text-sm text-slate-500 mb-4">Informe seus perfis nas redes sociais dos últimos 5 anos.</p>
                  <div className="space-y-3">
                    {formData.social_platforms.map((platform, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Plataforma</label>
                          <select
                            value={platform.name}
                            onChange={(e) => {
                              const updated = [...formData.social_platforms]
                              updated[idx] = { ...updated[idx], name: e.target.value }
                              updateField('social_platforms', updated)
                            }}
                            className={inputClass()}
                          >
                            <option value="">Selecione</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Twitter/X">Twitter/X</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="TikTok">TikTok</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Usuário / Handle</label>
                          <input
                            type="text"
                            value={platform.handle}
                            onChange={(e) => {
                              const updated = [...formData.social_platforms]
                              updated[idx] = { ...updated[idx], handle: e.target.value }
                              updateField('social_platforms', updated)
                            }}
                            className={inputClass()}
                            placeholder="@usuario"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.social_platforms.filter((_, i) => i !== idx)
                              updateField('social_platforms', updated)
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateField('social_platforms', [...formData.social_platforms, { name: '', handle: '' }])}
                      className="text-sm text-blue-700 font-semibold hover:underline"
                    >
                      + Adicionar rede social
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8 — Questões de segurança */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Questões de segurança</h2>
                <p className="text-sm text-slate-500 mb-6">Responda com honestidade. Mentir neste formulário pode resultar em negação permanente do visto.</p>

                {[
                  { key: 'sec_q1' as const, detailKey: 'sec_q1_details' as const, question: 'Pertence ou pertenceu a alguma organização terrorista?' },
                  { key: 'sec_q2' as const, detailKey: 'sec_q2_details' as const, question: 'Pretende cometer algum crime nos Estados Unidos?' },
                  { key: 'sec_q3' as const, detailKey: 'sec_q3_details' as const, question: 'Já foi preso ou condenado por algum crime em qualquer país?' },
                  { key: 'sec_q4' as const, detailKey: 'sec_q4_details' as const, question: 'Já usou ou é dependente de drogas ilícitas?' },
                  { key: 'sec_q5' as const, detailKey: 'sec_q5_details' as const, question: 'Já foi deportado ou removido dos Estados Unidos?' },
                  { key: 'sec_q6' as const, detailKey: 'sec_q6_details' as const, question: 'Já teve um visto americano negado ou entrada recusada nos EUA?' },
                  { key: 'sec_q7' as const, detailKey: 'sec_q7_details' as const, question: 'Já procurou obter ou ajudou outros a obter visto de forma fraudulenta?' },
                  { key: 'sec_q8' as const, detailKey: 'sec_q8_details' as const, question: 'É portador de doença contagiosa ou tem transtorno mental que possa representar risco?' },
                ].map(({ key, detailKey, question }, idx) => (
                  <div key={key} className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-800 mb-3">
                      <span className="text-slate-400 mr-2">{idx + 1}.</span>{question}
                    </p>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={key}
                          checked={formData[key] === false}
                          onChange={() => updateField(key, false)}
                          className="accent-blue-700"
                        />
                        <span className="text-sm font-medium text-slate-700">Não</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={key}
                          checked={formData[key] === true}
                          onChange={() => updateField(key, true)}
                          className="accent-red-600"
                        />
                        <span className="text-sm font-medium text-slate-700">Sim</span>
                      </label>
                    </div>
                    {formData[key] === true && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Forneça detalhes *</label>
                        <textarea
                          value={formData[detailKey]}
                          onChange={(e) => updateField(detailKey, e.target.value)}
                          className={`${inputClass()} min-h-[80px] resize-y`}
                          placeholder="Descreva a situação com detalhes..."
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <strong>Atenção:</strong> Ao prosseguir, você declara que todas as informações fornecidas neste formulário são verdadeiras e corretas.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex-1 border-2 border-slate-200 hover:border-slate-300 disabled:opacity-40 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {saving ? 'Salvando...' : currentStep === FORM_STEPS.length ? 'Salvar e finalizar ✓' : 'Próxima etapa →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
