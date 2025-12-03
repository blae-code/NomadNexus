import React, { useEffect, useState } from 'react';
import { dataClient } from '@/api/dataClient';

const CERTS = ['MEDICAL_CERT', 'NAV_CERT', 'COMBAT_CERT', 'HEAVY_CERT', 'RANGER_CERT', 'ENGINEERING_CERT'];

const ServiceRecordPanel = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    dataClient.entities.User.get(userId).then(setUser).catch(console.error);
  }, [userId]);

  const toggleCert = (cert) => {
    if (!user) return;
    const certs = new Set(user.certifications || []);
    if (certs.has(cert)) certs.delete(cert); else certs.add(cert);
    setUser({ ...user, certifications: Array.from(certs) });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await dataClient.entities.User.update(user.id, { certifications: user.certifications || [] });
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div className="border border-burnt-orange p-3 bg-black/50">
      <div className="text-xs font-mono text-tech-white/70 uppercase tracking-[0.2em] mb-2">Service Record</div>
      <div className="text-sm text-tech-white font-bold mb-2">{user.callsign || user.full_name}</div>
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-tech-white">
        {CERTS.map((cert) => (
          <label key={cert} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={user.certifications?.includes(cert)}
              onChange={() => toggleCert(cert)}
              className="appearance-none w-4 h-4 border border-burnt-orange bg-black checked:bg-burnt-orange"
            />
            <span>{cert}</span>
          </label>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 px-3 py-1 border border-burnt-orange text-xs font-bold bg-burnt-orange/20"
      >
        {saving ? 'SAVING...' : 'SAVE'}
      </button>
    </div>
  );
};

export default ServiceRecordPanel;
