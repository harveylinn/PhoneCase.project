import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import '../../styles/member/profile.css';

export default function ProfilePage() {
  const { currentMember, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  if (!currentMember) return null;

  function startEditing() {
    if (!currentMember) return;
    setName(currentMember.name);
    setPhone(currentMember.phone ?? '');
    setAddress(currentMember.defaultAddress ?? '');
    setMessage('');
    setEditing(true);
  }
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const trimmedPhone = phone.trim();
    if (!name.trim() || name.trim().length > 80) { setMessage('姓名必填，最多 80 字元。'); return; }
    if (trimmedPhone && (trimmedPhone.length > 30 || !/^\+?(?=(?:\D*\d){7,15}\D*$)[0-9-]+$/.test(trimmedPhone))) {
      setMessage('電話須包含 7–15 位數字，可含開頭 + 及連字號。'); return;
    }
    if (address.trim().length > 500) { setMessage('地址最多 500 字元。'); return; }
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({ name: name.trim(), phone: trimmedPhone, defaultAddress: address.trim() });
      setEditing(false);
      setMessage('個人資料已儲存。');
    } catch (failure) {
      setMessage(failure instanceof Error && !(failure instanceof TypeError) ? failure.message : '儲存失敗，請確認網路後重試。');
    } finally { setSaving(false); }
  }
  return <main className="member-profile">
    <section className="profile-card">
      <p className="profile-eyebrow">YOUR PERSONAL SPACE</p>
      <h1>會員中心</h1>
      <p>歡迎回來，{currentMember.name}。</p>
      <dl>
        <dt>帳號（唯讀）</dt><dd>{currentMember.account}</dd>
        <dt>電子郵件（唯讀）</dt><dd>{currentMember.email}</dd>
        {!editing && <>
          <dt>姓名</dt><dd>{currentMember.name}</dd>
          <dt>電話</dt><dd>{currentMember.phone || '尚未設定'}</dd>
          <dt>預設地址</dt><dd>{currentMember.defaultAddress || '尚未設定'}</dd>
        </>}
      </dl>
      {editing ? <form onSubmit={save} noValidate>
        <fieldset disabled={saving}>
          <legend>編輯個人資料</legend>
          <label htmlFor="profileName">姓名（必填）</label>
          <input id="profileName" name="name" autoComplete="name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} />
          <label htmlFor="profilePhone">電話（可留空）</label>
          <input id="profilePhone" name="phone" type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} />
          <label htmlFor="profileAddress">預設地址（可留空）</label>
          <textarea id="profileAddress" name="defaultAddress" autoComplete="street-address" maxLength={500} value={address} onChange={event => setAddress(event.target.value)} />
          <div className="profile-actions">
            <button type="submit">{saving ? '儲存中…' : '儲存'}</button>
            <button type="button" onClick={() => { setEditing(false); setMessage(''); }}>取消</button>
          </div>
        </fieldset>
      </form> : <button type="button" onClick={startEditing}>編輯個人資料</button>}
      {message && <p className="profile-message">{message}</p>}
      <div className="profile-actions"><Link to="/">返回首頁</Link><button type="button" onClick={logout}>登出</button></div>
    </section>
  </main>;
}
