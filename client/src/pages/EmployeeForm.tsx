import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ImagePlus, Save, Trash2 } from 'lucide-react'
import { api, type Employee } from '../api/client'
import PageHeader from '../components/layout/PageHeader'

type Form = {
  fullName: string
  email: string
  position: string
  department: string
  startDate: string
  notes: string
}

const EMPTY: Form = { fullName: '', email: '', position: '', department: '', startDate: '', notes: '' }

export default function EmployeeForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<Form>(EMPTY)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: employee } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get<Employee>(`/employees/${id}`)).data,
    enabled: isEdit,
  })

  useEffect(() => {
    if (!employee) return
    setForm({
      fullName: employee.fullName,
      email: employee.email || '',
      position: employee.position,
      department: employee.department,
      startDate: employee.startDate ? employee.startDate.slice(0, 10) : '',
      notes: employee.notes || '',
    })
    if (employee.photoPath) setPhotoPreview(employee.photoPath)
  }, [employee])

  function setField<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      if (photo) fd.append('photo', photo)
      if (isEdit) {
        await api.patch(`/employees/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/employees', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee', id] })
      navigate(isEdit ? `/employees/${id}` : '/roster')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'บันทึกไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!isEdit || !confirm('ยืนยันการ archive พนักงานคนนี้? (ไม่ลบประวัติประเมิน)')) return
    await api.delete(`/employees/${id}`)
    qc.invalidateQueries({ queryKey: ['employees'] })
    navigate('/roster')
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}
        subtitle={isEdit ? employee?.fullName : 'เพิ่มสมาชิกทีมใหม่ลงในสำรับ'}
        actions={
          <button onClick={() => navigate(-1)} className="btn-ghost">
            <ArrowLeft size={16} /> กลับ
          </button>
        }
      />

      <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-[260px,1fr]">
        {/* Photo panel */}
        <div className="panel p-5">
          <label className="label">รูปภาพ</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative flex aspect-[3/4] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] transition hover:bg-white/[0.04] hover:border-white/20"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-ink-600">
                <ImagePlus size={28} />
                <div className="text-xs">คลิกเพื่อเลือกรูป</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          <p className="mt-2.5 text-[11px] text-ink-600">รองรับ JPG, PNG, WebP (≤ 5MB)</p>
        </div>

        {/* Fields panel */}
        <div className="panel p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="label">ชื่อ-นามสกุล *</label>
              <input className="input" value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} required />
            </div>
            <div>
              <label className="label">อีเมล</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
            </div>
            <div>
              <label className="label">ตำแหน่ง *</label>
              <input className="input" value={form.position} onChange={(e) => setField('position', e.target.value)} required />
            </div>
            <div>
              <label className="label">แผนก *</label>
              <input className="input" value={form.department} onChange={(e) => setField('department', e.target.value)} required />
            </div>
            <div>
              <label className="label">วันที่เริ่มงาน</label>
              <input className="input" type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">หมายเหตุ</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="ข้อมูลเพิ่มเติม..."
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            {isEdit ? (
              <button type="button" onClick={onDelete} className="btn-ghost text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-300">
                <Trash2 size={14} /> Archive
              </button>
            ) : <span />}
            <button type="submit" className="btn-primary" disabled={busy}>
              <Save size={15} /> บันทึก
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
