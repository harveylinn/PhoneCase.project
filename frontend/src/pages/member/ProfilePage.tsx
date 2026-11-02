import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import '../../styles/member/profile.css';
import { formatMemberTime } from '../../utils/memberTime';

export default function ProfilePage() {
  const { currentMember, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');
  if (!currentMember) return null;

  function clearFieldErrors() {
    setNameError('');
    setPhoneError('');
    setAddressError('');
  }
  function startEditing() {
    if (!currentMember) return;
    setName(currentMember.name);
    setPhone(currentMember.phone ?? '');
    setAddress(currentMember.defaultAddress ?? '');
    setMessage('');
    clearFieldErrors();
    setEditing(true);
  }
  function cancelEditing() {
    setEditing(false);
    setMessage('');
    clearFieldErrors();
  }
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !editing) return;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    let nextNameError = '';
    if (!trimmedName) nextNameError = '請輸入姓名。';
    else if (trimmedName.length > 80) nextNameError = '姓名不可超過 80 字元。';

    // 電話維持選填；有填寫時沿用註冊頁的字元及數字位數檢查。
    const phoneCharactersValid = /^\+?[0-9-]+$/.test(trimmedPhone);
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    let nextPhoneError = '';
    if (trimmedPhone.length > 30) nextPhoneError = '電話不可超過 30 字元。';
    else if (trimmedPhone && (!phoneCharactersValid || phoneDigits.length < 7 || phoneDigits.length > 15)) {
      nextPhoneError = '請輸入有效電話。須包含 7–15 位數字，可含開頭 + 及連字號。';
    }
    const nextAddressError = trimmedAddress.length > 500 ? '地址不可超過 500 字元。' : '';

    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setAddressError(nextAddressError);
    setMessage('');
    if (nextNameError || nextPhoneError || nextAddressError) return;

    setSaving(true);
    try {
      await updateProfile({ name: trimmedName, phone: trimmedPhone, defaultAddress: trimmedAddress });
      clearFieldErrors();
      setEditing(false);
      setMessage('個人資料已儲存。');
    } catch (failure) {
      setMessage(failure instanceof Error && !(failure instanceof TypeError) ? failure.message : '儲存失敗，請確認網路後重試。');
    } finally { setSaving(false); }
  }
  return <main className="member-profile">
    <div className="profile-layout">
      <aside className="profile-sidebar">
        <h2>會員中心</h2>
        <nav className="profile-nav">
          <Link className="is-active" to="/profile">個人資料</Link>
          <Link to="/orderlist">我的訂單</Link>
          <button type="button" onClick={logout}>登出</button>
          <Link to="/">返回首頁</Link>
        </nav>
      </aside>
      <section className="profile-panel">
        <h1>個人資料</h1>
        <form onSubmit={save} noValidate>
          <fieldset disabled={saving}>
            <div className="profile-fields">
              <div className="profile-field">
                <label htmlFor="profileAccount">帳號 <span>（僅顯示）</span></label>
                <input className="readonly-field" id="profileAccount" name="account" autoComplete="username" value={currentMember.account} readOnly />
              </div>
              <div className="profile-field">
                <label htmlFor="profilePasswordInfo">密碼雜湊</label>
                <input className="readonly-field profile-password-info" id="profilePasswordInfo" value="由系統管理，不提供檢視或修改。" readOnly />
              </div>
              <div className="profile-field">
                <label htmlFor="profileName">姓名 <span>（必填）</span></label>
                <input className={nameError ? 'has-error' : undefined} id="profileName" name="name" autoComplete="name" required maxLength={80} readOnly={!editing} value={editing ? name : currentMember.name} onChange={event => setName(event.target.value)} />
                <span className="profile-field-error" hidden={!nameError}>{nameError}</span>
              </div>
              <div className="profile-field">
                <label htmlFor="profilePhone">電話 <span>（選填）</span></label>
                <input className={phoneError ? 'has-error' : undefined} id="profilePhone" name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="尚未設定" readOnly={!editing} value={editing ? phone : currentMember.phone ?? ''} onChange={event => setPhone(event.target.value)} />
                {editing && <span className="profile-field-hint">選填；7–15 位數字，可含開頭 + 及連字號。</span>}
                <span className="profile-field-error" hidden={!phoneError}>{phoneError}</span>
              </div>
              <div className="profile-field full-width">
                <label htmlFor="profileEmail">電子郵件 <span>（僅顯示）</span></label>
                <input className="readonly-field" id="profileEmail" name="email" type="email" autoComplete="email" value={currentMember.email} readOnly />
              </div>
              <div className="profile-field full-width">
                <label htmlFor="profileAddress">通訊地址 <span>（選填）</span></label>
                <textarea className={addressError ? 'has-error' : undefined} id="profileAddress" name="defaultAddress" rows={2} autoComplete="street-address" maxLength={500} placeholder="請輸入通訊地址（選填）" readOnly={!editing} value={editing ? address : currentMember.defaultAddress ?? ''} onChange={event => setAddress(event.target.value)} />
                <span className="profile-field-error" hidden={!addressError}>{addressError}</span>
              </div>
              <div className="profile-field">
                <label htmlFor="profileCreatedAt">建立時間 <span>（僅顯示）</span></label>
                <input className="readonly-field" id="profileCreatedAt" value={formatMemberTime(currentMember.createdAt)} readOnly />
              </div>
              <div className="profile-field">
                <label htmlFor="profileUpdatedAt">更新時間 <span>（僅顯示）</span></label>
                <input className="readonly-field" id="profileUpdatedAt" value={formatMemberTime(currentMember.updatedAt)} readOnly />
              </div>
            </div>
          </fieldset>
          <div className="profile-form-footer">
            <p className="profile-message">{message || (editing ? '修改完成後，請按儲存資料。' : '點選編輯個人資料，即可修改姓名、電話與地址。')}</p>
            <div className="profile-actions">
              {editing ? <>
                <button className="profile-cancel-button" type="button" disabled={saving} onClick={cancelEditing}>取消</button>
                <button className="profile-save-button" type="submit" disabled={saving}>{saving ? '儲存中…' : '儲存資料'}</button>
              </> : <button className="profile-save-button" type="button" onClick={startEditing}>編輯個人資料</button>}
            </div>
          </div>
        </form>
      </section>
    </div>
  </main>;
}
