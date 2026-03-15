'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import FilterChips from '@/components/ui/FilterChips'

interface AdTest {
  id: string
  test_number: number | null
  launch_date: string | null
  creative_type: string | null
  test_type: string | null
  variable_testing: string | null
  avatar: string | null
  awareness_level: string | null
  hypothesis: string
  num_variations: number
  status: string
  results: string | null
  problem_pain_point: string | null
  mass_desire: string | null
  angle: string | null
  ump: string | null
  ums: string | null
  lead_type: string | null
  landing_page: string | null
  ad_inspiration: string | null
  learnings_winner: string | null
  learnings_loser: string | null
  next_hypothesis: string | null
  created_at: string
}

const resultBadge: Record<string, { label: string; color: string }> = {
  Winner: { label: 'Winner', color: 'bg-green-100 text-green-700' },
  Loser: { label: 'Loser', color: 'bg-red-100 text-red-700' },
  Breakeven: { label: 'Breakeven', color: 'bg-yellow-100 text-yellow-700' },
  Inconclusive: { label: 'Inconclusive', color: 'bg-yellow-100 text-yellow-700' },
}

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-600',
  launched: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

const awarenessColors: Record<string, string> = {
  Unaware: 'bg-red-100 text-red-700',
  'Problem Aware': 'bg-orange-100 text-orange-700',
  'Solution Aware': 'bg-yellow-100 text-yellow-700',
  'Product Aware': 'bg-green-100 text-green-700',
}

const emptyTest: Partial<AdTest> = {
  test_number: null,
  launch_date: null,
  creative_type: '',
  test_type: '',
  variable_testing: '',
  avatar: '',
  awareness_level: '',
  hypothesis: '',
  num_variations: 1,
  status: 'planned',
  results: null,
  problem_pain_point: '',
  mass_desire: '',
  angle: '',
  ump: '',
  ums: '',
  lead_type: '',
  landing_page: '',
  ad_inspiration: '',
  learnings_winner: '',
  learnings_loser: '',
  next_hypothesis: '',
}

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'launched', label: 'Launched' },
  { value: 'done', label: 'Done' },
]

export default function TestsPage() {
  const [tests, setTests] = useState<AdTest[]>([])
  const [selected, setSelected] = useState<AdTest | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<AdTest>>(emptyTest)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const supabase = createClient()

  const fetchTests = async () => {
    let query = supabase
      .from('ad_tests')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setTests(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTests()
  }, [statusFilter])

  const handleSave = async () => {
    setSaving(true)
    if (selected) {
      await supabase
        .from('ad_tests')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', selected.id)
    } else {
      await supabase.from('ad_tests').insert(form)
    }
    await fetchTests()
    setShowForm(false)
    setSelected(null)
    setForm(emptyTest)
    setSaving(false)
  }

  const openEdit = (test: AdTest) => {
    setSelected(test)
    setForm(test)
    setShowForm(true)
  }

  const openNew = (prefill?: Partial<AdTest>) => {
    setSelected(null)
    setForm({ ...emptyTest, ...prefill })
    setShowForm(true)
  }

  const updateForm = (key: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ad Tests</h1>
        <button
          onClick={() => openNew()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl active:bg-blue-700 text-sm font-medium"
        >
          + Add Test
        </button>
      </div>

      <div className="mb-4">
        <FilterChips
          options={statusOptions}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
      ) : tests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No ad tests yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create a new test to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {tests.map((test) => (
            <button
              key={test.id}
              onClick={() => openEdit(test)}
              className="block w-full text-left bg-white dark:bg-[#262626] rounded-xl border border-gray-100 dark:border-gray-700 p-4 active:bg-gray-50 dark:active:bg-gray-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {test.test_number && (
                      <span className="text-xs font-medium text-gray-400">#{test.test_number}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[test.status] || 'bg-gray-100 text-gray-600'}`}>
                      {test.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-2">
                    {test.hypothesis}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {test.creative_type && (
                      <span className="text-xs text-gray-400">{test.creative_type}</span>
                    )}
                    {test.awareness_level && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${awarenessColors[test.awareness_level] || 'bg-gray-100 text-gray-600'}`}>
                        {test.awareness_level}
                      </span>
                    )}
                  </div>
                </div>
                {test.results && (
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${resultBadge[test.results]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {resultBadge[test.results]?.label || test.results}
                  </span>
                )}
              </div>
              {test.launch_date && (
                <p className="text-xs text-gray-400 mt-2">{formatDate(test.launch_date)}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Form Modal — Full screen on mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-white dark:bg-[#1a1a1a] z-50 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 h-12">
              <button
                onClick={() => { setShowForm(false); setSelected(null) }}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                Cancel
              </button>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {selected ? 'Edit Test' : 'New Test'}
              </h2>
              <button
                onClick={handleSave}
                disabled={saving || !form.hypothesis}
                className="text-sm text-blue-600 font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="px-4 py-4 space-y-6 pb-20">
            {/* Section 1: Setup */}
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Setup</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Test #" type="number" value={form.test_number || ''} onChange={(v) => updateForm('test_number', v ? parseInt(v as string) : null)} />
                  <FormField label="Launch Date" type="date" value={form.launch_date || ''} onChange={(v) => updateForm('launch_date', v || null)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Creative Type" value={form.creative_type || ''} onChange={(v) => updateForm('creative_type', v)} placeholder="Static / Video / UGC" />
                  <FormField label="Type of Test" value={form.test_type || ''} onChange={(v) => updateForm('test_type', v)} placeholder="New Concept / Iteration" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Landing Page" type="url" value={form.landing_page || ''} onChange={(v) => updateForm('landing_page', v)} />
                  <FormField label="Ad Inspiration" type="url" value={form.ad_inspiration || ''} onChange={(v) => updateForm('ad_inspiration', v)} />
                </div>
                <FormField label="Variable Testing" value={form.variable_testing || ''} onChange={(v) => updateForm('variable_testing', v)} placeholder="Desire / Angle / Awareness" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Avatar" value={form.avatar || ''} onChange={(v) => updateForm('avatar', v)} />
                  <FormField label="Pain Point" value={form.problem_pain_point || ''} onChange={(v) => updateForm('problem_pain_point', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Mass Desire" value={form.mass_desire || ''} onChange={(v) => updateForm('mass_desire', v)} />
                  <FormField label="Angle" value={form.angle || ''} onChange={(v) => updateForm('angle', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="UMP" value={form.ump || ''} onChange={(v) => updateForm('ump', v)} />
                  <FormField label="UMS" value={form.ums || ''} onChange={(v) => updateForm('ums', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Lead Type" value={form.lead_type || ''} onChange={(v) => updateForm('lead_type', v)} placeholder="Story / Statement / Question" />
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Awareness Level</label>
                    <select
                      value={form.awareness_level || ''}
                      onChange={(e) => updateForm('awareness_level', e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option>Unaware</option>
                      <option>Problem Aware</option>
                      <option>Solution Aware</option>
                      <option>Product Aware</option>
                    </select>
                  </div>
                </div>
                <FormField label="Variations" type="number" value={form.num_variations || 1} onChange={(v) => updateForm('num_variations', parseInt(v as string) || 1)} />
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hypothesis <span className="text-red-400">*</span></label>
                  <textarea
                    value={form.hypothesis || ''}
                    onChange={(e) => updateForm('hypothesis', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What are you creating/testing? What gives you confidence?"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Results */}
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Results</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                  <select
                    value={form.status || 'planned'}
                    onChange={(e) => updateForm('status', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="planned">Planned</option>
                    <option value="launched">Launched</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Results</label>
                  <select
                    value={form.results || ''}
                    onChange={(e) => updateForm('results', e.target.value || null)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option>Winner</option>
                    <option>Loser</option>
                    <option>Breakeven</option>
                    <option>Inconclusive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Learnings */}
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Learnings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Learnings for WINNERS</label>
                  <textarea
                    value={form.learnings_winner || ''}
                    onChange={(e) => updateForm('learnings_winner', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Learnings for LOSERS</label>
                  <textarea
                    value={form.learnings_loser || ''}
                    onChange={(e) => updateForm('learnings_loser', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Next Hypothesis</label>
                  <textarea
                    value={form.next_hypothesis || ''}
                    onChange={(e) => updateForm('next_hypothesis', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What hypothesis will you test next based on these learnings?"
                  />
                </div>
              </div>
            </div>

            {/* Create Next Test button */}
            {selected?.next_hypothesis && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setTimeout(() => openNew({ hypothesis: selected.next_hypothesis || '' }), 100)
                }}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl active:bg-gray-200 dark:active:bg-gray-700 text-sm font-medium"
              >
                Create Next Test from Learnings
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Reusable form field component
function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
      />
    </div>
  )
}
