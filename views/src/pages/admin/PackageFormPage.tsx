import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Star } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input, Textarea } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { packageApi, uploadApi } from '../../services/api';
import type { PackageFormData, PackageImage } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { tokenizeCategories } from '../../utils/security';

const emptyForm: PackageFormData = {
  title: '',
  titleZh: '',
  shortDescription: '',
  shortDescriptionZh: '',
  description: '',
  descriptionZh: '',
  price: 1,
  currency: 'IDR',
  duration: 1,
  durationUnit: 'days',
  categories: [],
  categoriesZh: [],
  destination: '',
  destinationZh: '',
  availability: '',
  availabilityZh: '',
  maxParticipants: 1,
  highlights: [],
  highlightsZh: [],
  included: [],
  includedZh: [],
  excluded: [],
  excludedZh: [],
  itinerary: [],
  status: 'draft',
  featured: false,
};

export const PackageFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState<PackageFormData>(emptyForm);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [saving, setSaving] = useState<boolean>(false);
  const [includedText, setIncludedText] = useState<string>('');
  const [excludedText, setExcludedText] = useState<string>('');
  const [includedZhText, setIncludedZhText] = useState<string>('');
  const [excludedZhText, setExcludedZhText] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [categoryZhInput, setCategoryZhInput] = useState<string>('');
  const [highlightInput, setHighlightInput] = useState<string>('');
  const [highlightZhInput, setHighlightZhInput] = useState<string>('');
  const [images, setImages] = useState<PackageImage[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // 1 English, 2 Mandarin

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      try {
        const [resEn, resZh] = await Promise.all([
          packageApi.getById(id, 'en'),
          packageApi.getById(id, 'zh'),
        ]);
        if (resEn.success && resEn.data) {
          const pEn: any = resEn.data;
          const base: PackageFormData = {
            title: pEn.title || '',
            titleZh: '',
            shortDescription: pEn.shortDescription || '',
            shortDescriptionZh: '',
            description: pEn.description || '',
            descriptionZh: '',
            price: pEn.price || 1,
            currency: pEn.currency || 'IDR',
            duration: pEn.duration || 1,
            durationUnit: pEn.durationUnit || 'days',
            categories: pEn.categories || [],
            categoriesZh: [],
            destination: pEn.destination || '',
            destinationZh: '',
            availability: pEn.availability || '',
            availabilityZh: '',
            maxParticipants: pEn.maxParticipants || 1,
            highlights: pEn.highlights || [],
            highlightsZh: [],
            included: pEn.included || [],
            includedZh: [],
            excluded: pEn.excluded || [],
            excludedZh: [],
            itinerary: pEn.itinerary || [],
            status: (pEn.status === 'draft' || pEn.status === 'published') ? pEn.status : 'draft',
            featured: !!pEn.featured,
          };
          if (resZh.success && resZh.data) {
            const pZh: any = resZh.data;
            base.titleZh = pZh.title || '';
            base.shortDescriptionZh = pZh.shortDescription || '';
            base.descriptionZh = pZh.description || '';
            base.categoriesZh = pZh.categories || [];
            base.destinationZh = pZh.destination || '';
            base.availabilityZh = pZh.availability || '';
            base.highlightsZh = pZh.highlights || [];
            base.includedZh = pZh.included || [];
            base.excludedZh = pZh.excluded || [];
            base.itinerary = (base.itinerary || []).map((day: any, idx: number) => {
              const zhDay = (pZh.itinerary || [])[idx];
              if (!zhDay) return day;
              return {
                ...day,
                titleZh: zhDay.title,
                descriptionZh: zhDay.description,
                activitiesZh: zhDay.activities,
                mealsZh: zhDay.meals,
                accommodationZh: zhDay.accommodation,
              };
            });
          }
          setForm(base);
          setIncludedText(base.included.join('\n'));
          setExcludedText(base.excluded.join('\n'));
          setIncludedZhText(base.includedZh.join('\n'));
          setExcludedZhText(base.excludedZh.join('\n'));
          setImages(pEn.images || []);
        }
      } catch (e) {
        addToast('Failed to load package', 'error');
      } finally { setLoading(false); }
    })();
  }, [id]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['price','duration','maxParticipants'].includes(name) ? Number(value) : value,
    }));
  };

  const onSubmit = async () => {
    if (form.price < 1) { addToast('Price must be at least 1', 'error'); return; }
    if (form.maxParticipants < 1) { addToast('Max participants must be at least 1', 'error'); return; }
    if (!form.title.trim()) { addToast('Title is required', 'error'); return; }
    if (!form.destination.trim()) { addToast('Destination is required', 'error'); return; }
    if (form.status === 'published') {
      if (!form.titleZh?.trim() || !form.shortDescriptionZh?.trim() || !form.descriptionZh?.trim() || !form.destinationZh?.trim()) {
        addToast('Mandarin required fields missing', 'error'); return;
      }
    }
    setSaving(true);
    try {
      const payload: PackageFormData = {
        ...form,
        included: includedText.split('\n').map(s=>s.trim()).filter(Boolean),
        excluded: excludedText.split('\n').map(s=>s.trim()).filter(Boolean),
        includedZh: includedZhText.split('\n').map(s=>s.trim()).filter(Boolean),
        excludedZh: excludedZhText.split('\n').map(s=>s.trim()).filter(Boolean),
      };
      (payload as any).images = images.map((img, idx) => ({ url: img.url, alt: img.alt || form.title, order: idx, isCover: !!img.isCover }));
      if (isEdit && id) { await packageApi.update(id, payload); addToast('Package updated', 'success'); }
      else { await packageApi.create(payload); addToast('Package created', 'success'); }
      navigate('/admin/packages');
    } catch (e) { addToast(e instanceof Error ? e.message : 'Failed to save package', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  }

  const englishRequiredOk = [form.title, form.shortDescription, form.description, form.destination].every(v=>v&&v.trim());
  const mandarinRequiredOk = [form.titleZh, form.shortDescriptionZh, form.descriptionZh, form.destinationZh].every(v=>v&&v.trim());
  const progressPercent = step === 1 ? (englishRequiredOk ? 50 : 25) : (mandarinRequiredOk ? 100 : 75);

  return (
    <div className="space-y-6">
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{width: progressPercent+'%'}} /></div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Package' : 'Create Package'}</h1>
          <p className="text-gray-600 mt-1">{step===1?'Step 1: English Content & Details':'Step 2: Mandarin Content & Publish'}</p>
          <div className="flex gap-2 mt-2 text-xs">
            <span className={`px-2 py-1 rounded ${englishRequiredOk?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>EN {englishRequiredOk?'Complete':'Incomplete'}</span>
            <span className={`px-2 py-1 rounded ${mandarinRequiredOk?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>ZH {mandarinRequiredOk?'Complete':'Incomplete'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`px-3 py-1 rounded-full ${step===1?'bg-blue-600 text-white':'bg-gray-200 text-gray-700'}`}>1. English</span>
          <span className={`px-3 py-1 rounded-full ${step===2?'bg-blue-600 text-white':'bg-gray-200 text-gray-700'}`}>2. Mandarin</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <div className="p-6 space-y-6">
            <div className="border-b pb-4"><h2 className="text-xl font-bold text-gray-900">Basic Information (English)</h2><p className="text-sm text-gray-600 mt-1">Essential details (English version)</p></div>
            <Input label="Title" name="title" value={form.title} onChange={onChange} placeholder="Bali Paradise Tour" required />
            <Input label="Availability" name="availability" value={form.availability} onChange={onChange} placeholder="year-round" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories (e.g., beach, foodie, historical)</label>
                <div className="space-y-2">
                  <input type="text" value={categoryInput} onChange={(e)=>setCategoryInput(e.target.value)} onKeyDown={(e)=>{ if(['Enter',',',';'].includes(e.key)){ e.preventDefault(); const tokens = tokenizeCategories(categoryInput); if(tokens.length){ setForm(prev=>({...prev,categories:Array.from(new Set([...prev.categories,...tokens]))})); setCategoryInput(''); } } }} onBlur={()=>{ const tokens=tokenizeCategories(categoryInput); if(tokens.length){ setForm(prev=>({...prev,categories:Array.from(new Set([...prev.categories,...tokens]))})); setCategoryInput(''); } }} placeholder="Type and press Enter or use , ;" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.categories.length>0 && <div className="flex flex-wrap gap-2">{form.categories.map((cat,idx)=>(<span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{cat}<button type="button" onClick={()=>setForm(prev=>({...prev,categories:prev.categories.filter((_,i)=>i!==idx)}))}><X className="h-3 w-3" /></button></span>))}</div>}
                  <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (press Enter)</label>
                  <input type="text" value={highlightInput} onChange={(e)=>setHighlightInput(e.target.value)} onKeyDown={(e)=>{ if(['Enter',',',';'].includes(e.key)){ e.preventDefault(); const tokens=tokenizeCategories(highlightInput); if(tokens.length){ setForm(prev=>({...prev,highlights:Array.from(new Set([...(prev.highlights||[]),...tokens]))})); setHighlightInput(''); } } }} onBlur={()=>{ const tokens=tokenizeCategories(highlightInput); if(tokens.length){ setForm(prev=>({...prev,highlights:Array.from(new Set([...(prev.highlights||[]),...tokens]))})); setHighlightInput(''); } }} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Scenic beach, Local cuisine" />
                  {form.highlights.length>0 && <div className="flex flex-wrap gap-2 mt-2">{form.highlights.map((h,idx)=>(<span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">{h}<button type="button" onClick={()=>setForm(prev=>({...prev,highlights:prev.highlights.filter((_,i)=>i!==idx)}))}><X className="h-3 w-3" /></button></span>))}</div>}
                </div>
              </div>
              <Input label="Destination" name="destination" value={form.destination} onChange={onChange} placeholder="Bali, Indonesia" required />
            </div>
            <Textarea label="Short Description" name="shortDescription" value={form.shortDescription} onChange={onChange} rows={3} placeholder="A brief overview of the package..." required />
            <Textarea label="Description" name="description" value={form.description} onChange={onChange} rows={8} placeholder="Detailed description of the package..." required />
            <Textarea label="What's Included (one item per line)" value={includedText} onChange={(e)=>setIncludedText(e.target.value)} rows={6} placeholder="Transport\nAccommodation\nMeals\nTour guide" />
            <Textarea label="What's Excluded (one item per line)" value={excludedText} onChange={(e)=>setExcludedText(e.target.value)} rows={6} placeholder="Personal expenses\nTravel insurance\nTips" />
            <div className="border-b pb-4 mt-4"><h2 className="text-xl font-bold text-gray-900">Pricing & Duration</h2><p className="text-sm text-gray-600 mt-1">Set pricing and time details</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Price *</label><input type="number" name="price" value={form.price} onChange={onChange} min={1} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><p className="text-xs text-gray-500 mt-1">Minimum: 1</p></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label><select name="currency" value={form.currency} onChange={onChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="IDR">IDR - Indonesian Rupiah</option><option value="USD">USD - US Dollar</option><option value="SGD">SGD - Singapore Dollar</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Max Participants *</label><input type="number" name="maxParticipants" value={form.maxParticipants} onChange={onChange} min={1} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /><p className="text-xs text-gray-500 mt-1">Minimum: 1 person</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Duration (number)" name="duration" type="number" value={form.duration} onChange={onChange} placeholder="3" required /><div><label className="block text-sm font-medium text-gray-700 mb-2">Duration Unit</label><select name="durationUnit" value={form.durationUnit} onChange={onChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="days">Days</option><option value="nights">Nights</option><option value="hours">Hours</option></select></div></div>
            <div className="border-b pb-4 mt-8"><h2 className="text-xl font-bold text-gray-900">Images</h2><p className="text-sm text-gray-600 mt-1">Upload beautiful images of your package</p></div>
            <label className="block cursor-pointer"><div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all"><Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-900 mb-1">Click to upload or drag and drop</p><p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p><input type="file" accept="image/*" className="hidden" onChange={async (e)=>{const f=e.target.files?.[0]; if(!f) return; try{const res=await uploadApi.uploadImage(f,'packages'); if(res.success && (res as any).data?.url){const url=(res as any).data.url; const img: PackageImage={id:'',url,alt:form.title||'image',order:images.length,isCover:images.length===0}; setImages(prev=>[...prev,img]); addToast('Image uploaded','success');}} catch{addToast('Failed to upload image','error');} finally{ if(e.currentTarget) e.currentTarget.value=''; } }} /></div></label>
            {images.length>0 && <div className="space-y-3"><p className="text-sm font-medium text-gray-700">{images.length} image{images.length>1?'s':''} uploaded</p><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{images.map((img,idx)=>(<div key={idx} className="relative group aspect-square"><img src={img.url} alt={img.alt} className="w-full h-full object-cover rounded-lg shadow-md" />{img.isCover && <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1"><Star className="h-3 w-3 fill-current" /> Cover</div>}<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">{!img.isCover && <button type="button" className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md text-sm font-medium" onClick={()=>setImages(prev=>prev.map((im,i)=>({...im,isCover:i===idx})))}>Set as Cover</button>}<button type="button" className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium" onClick={()=>setImages(prev=>prev.filter((_,i)=>i!==idx))}>Remove</button></div></div>))}</div></div>}
            <div className="flex justify-between pt-4"><Button variant="outline" isLoading={saving} onClick={()=>{ setForm(prev=>({...prev,status:'draft'})); onSubmit(); }}>💾 Save Draft</Button><Button onClick={()=>{ if(!englishRequiredOk){ addToast('Fill required English fields','error'); return; } setStep(2); }}>Next: Mandarin ➜</Button></div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <div className="p-6 space-y-6">
            <div className="border-b pb-4"><h2 className="text-xl font-bold text-gray-900">基础信息 (中文)</h2><p className="text-sm text-gray-600 mt-1">填写该套餐的中文内容</p></div>
            <Input label="标题 (Chinese Title)" name="titleZh" value={form.titleZh || ''} onChange={onChange} placeholder="巴厘岛天堂之旅" />
            <Input label="可用性 (Availability Zh)" name="availabilityZh" value={form.availabilityZh || ''} onChange={onChange} placeholder="全年" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类 (用逗号或回车分隔)</label>
                <div className="space-y-2">
                  <input type="text" value={categoryZhInput} onChange={(e)=>setCategoryZhInput(e.target.value)} onKeyDown={(e)=>{ if(['Enter',',',';'].includes(e.key)){ e.preventDefault(); const tokens=tokenizeCategories(categoryZhInput); if(tokens.length){ setForm(prev=>({...prev,categoriesZh:Array.from(new Set([...(prev.categoriesZh||[]),...tokens]))})); setCategoryZhInput(''); } } }} onBlur={()=>{ const tokens=tokenizeCategories(categoryZhInput); if(tokens.length){ setForm(prev=>({...prev,categoriesZh:Array.from(new Set([...(prev.categoriesZh||[]),...tokens]))})); setCategoryZhInput(''); } }} placeholder="输入并按 Enter 或使用 , ;" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.categoriesZh.length>0 && <div className="flex flex-wrap gap-2">{form.categoriesZh.map((cat,idx)=>(<span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{cat}<button type="button" onClick={()=>setForm(prev=>({...prev,categoriesZh:prev.categoriesZh.filter((_,i)=>i!==idx)}))}><X className="h-3 w-3" /></button></span>))}</div>}
                  <label className="block text-sm font-medium text-gray-700 mb-2">亮点 (按 Enter 添加)</label>
                  <input type="text" value={highlightZhInput} onChange={(e)=>setHighlightZhInput(e.target.value)} onKeyDown={(e)=>{ if(['Enter',',',';'].includes(e.key)){ e.preventDefault(); const tokens=tokenizeCategories(highlightZhInput); if(tokens.length){ setForm(prev=>({...prev,highlightsZh:Array.from(new Set([...(prev.highlightsZh||[]),...tokens]))})); setHighlightZhInput(''); } } }} onBlur={()=>{ const tokens=tokenizeCategories(highlightZhInput); if(tokens.length){ setForm(prev=>({...prev,highlightsZh:Array.from(new Set([...(prev.highlightsZh||[]),...tokens]))})); setHighlightZhInput(''); } }} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="美丽海滩, 当地美食" />
                  {form.highlightsZh.length>0 && <div className="flex flex-wrap gap-2 mt-2">{form.highlightsZh.map((h,idx)=>(<span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1">{h}<button type="button" onClick={()=>setForm(prev=>({...prev,highlightsZh:prev.highlightsZh.filter((_,i)=>i!==idx)}))}><X className="h-3 w-3" /></button></span>))}</div>}
                </div>
              </div>
              <Input label="目的地 (Destination Zh)" name="destinationZh" value={form.destinationZh || ''} onChange={onChange} placeholder="巴厘岛, 印度尼西亚" />
            </div>
            <Textarea label="简短描述" name="shortDescriptionZh" value={form.shortDescriptionZh || ''} onChange={onChange} rows={3} placeholder="套餐的简要概述..." />
            <Textarea label="详细描述" name="descriptionZh" value={form.descriptionZh || ''} onChange={onChange} rows={8} placeholder="套餐的详细介绍..." />
            <Textarea label="费用包含 (每行一条)" value={includedZhText} onChange={(e)=>setIncludedZhText(e.target.value)} rows={6} placeholder="交通\n住宿\n餐食\n导游" />
            <Textarea label="费用不含 (每行一条)" value={excludedZhText} onChange={(e)=>setExcludedZhText(e.target.value)} rows={6} placeholder="个人消费\n旅游保险\n小费" />
            <div className="mt-10 border-t pt-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Publishing Status</label><select name="status" value={form.status} onChange={onChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="draft">Draft (Not visible to public)</option><option value="published">Published (Live on website)</option></select><p className="text-xs text-gray-500 mt-2">{form.status==='draft'?'Draft will not be visible to users.':'Package will be live and visible to all users.'}</p></div>
              <div className="flex items-center"><input type="checkbox" id="featured" checked={form.featured} onChange={(e)=>setForm({...form,featured:e.target.checked})} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" /><label htmlFor="featured" className="ml-2 block text-sm text-gray-700 font-medium flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> Mark as Featured</label></div>
              <div className="flex justify-between gap-3 pt-2">
                <Button variant="ghost" onClick={()=>navigate('/admin/packages')}>Cancel</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={()=>{ setForm(prev=>({...prev,status:'draft'})); onSubmit(); }} isLoading={saving}>💾 Save Draft</Button>
                  <Button onClick={()=>{ if(form.status==='published' && !mandarinRequiredOk){ addToast('Complete Mandarin required fields','error'); return; } onSubmit(); }} isLoading={saving}>{form.status==='published'?'✓ Publish Package':'Save'}</Button>
                </div>
              </div>
              <Button variant="ghost" onClick={()=>setStep(1)}>← Back to English</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
