import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePharmacy } from '../hooks/usePharmacy'
import { usePharmacyPersons } from '../hooks/usePharmacyPersons'
import { usePharmacyDocuments } from '../hooks/usePharmacyDocuments'
import { usePharmacyIT } from '../hooks/usePharmacyIT'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  ArrowLeftIcon, PencilSquareIcon,
  BuildingStorefrontIcon, WrenchScrewdriverIcon,
  UsersIcon, FolderOpenIcon, ExclamationTriangleIcon,
  DocumentTextIcon, ComputerDesktopIcon,
  PlusIcon, TrashIcon, XMarkIcon, ArrowsRightLeftIcon,
  DocumentDuplicateIcon, ChevronDownIcon, MagnifyingGlassIcon,
  CalendarDaysIcon, ShieldCheckIcon, EyeIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/pharmacy/ConfirmDialog'
import EquipmentSummaryTable from '../components/pharmacy/EquipmentSummaryTable'
import {
  PERSON_ROLES, RESPONSIBILITY_AREAS, DOC_CATEGORIES, IT_TYPES,
  CONNECTION_OPTIONS, MONITOR_CONN, DISK_TYPES, CAPA_OPTIONS,
} from '../components/pharmacy/PHARMACY_CONSTANTS'
import { Label, Input, Select, Textarea } from '../components/pharmacy/PharmacyFormAtoms'

// ── Helpers ──────────────────────────────────────────────────────────────────
const PROVINCE_LABEL = {
  almeria:'Almería',cadiz:'Cádiz',cordoba:'Córdoba',granada:'Granada',
  huelva:'Huelva',jaen:'Jaén',malaga:'Málaga',sevilla:'Sevilla',
}
const LEGAL_LABEL = {
  autonomo:'Autónomo',cb:'C.B.',sl:'S.L.',
  autonomo_sl:'Autónomo + S.L.',cb_sl:'C.B. + S.L.',
}

function Field({ label, value, wide, emptyText = 'Sin informar' }) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div className={wide ? 'col-span-2 md:c