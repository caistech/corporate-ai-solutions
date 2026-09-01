import { BusinessAvailability } from '@/lib/compiler/types'

export const AVAILABILITY_OPTIONS: { value: BusinessAvailability; label: string }[] = [
  { value: 'Immediately', label: 'Immediately — user/system is waiting' },
  { value: 'Within-seconds', label: 'Within seconds' },
  { value: 'Within-minutes', label: 'Within minutes' },
  { value: 'Within-an-hour', label: 'Within an hour' },
  { value: 'By-defined-deadline', label: 'By a defined deadline' },
  { value: 'No-immediate-requirement', label: 'No immediate requirement' },
]

export const COMPILE_STEPS = [
  'Discovering solution',
  'Building workload graph',
  'Deriving inference operations',
  'Evaluating execution constraints',
  'Generating workload dataset',
]