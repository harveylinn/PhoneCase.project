import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import './MemberMenu.css';

export default function MemberMenu() {
  const { currentMember, logout } = useAuth();
  const location = useLocation();
  if (!currentMember) return null;
  // 路由切換時重新建立選單，避免前一頁的展開狀態殘留。
  return <MemberDropdown key={location.key} name={currentMember.name} logout={logout} />;
}

function MemberDropdown({ name, logout }: { name: string; logout: () => void }) {
  const [open, setOpen] = useState(false);
  const [panelLeft, setPanelLeft] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  function positionPanel() {
    if (!root.current) return;
    const rect = root.current.getBoundingClientRect();
    const width = Math.min(224, window.innerWidth - 32);
    // 一般靠右對齊；窄螢幕換行時，將選單保持在視窗內。
    const left = Math.max(16, Math.min(rect.right - width, window.innerWidth - 16 - width));
    setPanelLeft(left - rect.left);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', positionPanel);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', positionPanel);
    };
  }, [open]);

  return <div className="member-menu" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button className="member-menu__trigger" type="button" ref={trigger}
      aria-expanded={open} aria-controls={panelId}
      onClick={() => { positionPanel(); setOpen(value => !value); }}>
      <UserRound size={18} strokeWidth={1.75} aria-hidden="true" />
      <span>會員中心</span>
      <ChevronDown className="member-menu__chevron" size={15} aria-hidden="true" />
    </button>
    <div className="member-menu__panel" id={panelId} hidden={!open} style={{ left: panelLeft }}>
      <p className="member-menu__greeting">你好，<span>{name}</span></p>
      <div className="member-menu__links">
        <NavLink className="member-menu__item" to="/profile" end onClick={() => setOpen(false)}>個人資料</NavLink>
        <NavLink className="member-menu__item" to="/orderlist" end onClick={() => setOpen(false)}>我的訂單</NavLink>
      </div>
      <div className="member-menu__footer">
        <button className="member-menu__item member-menu__logout" type="button"
          onClick={() => { setOpen(false); logout(); }}>
          <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />登出
        </button>
      </div>
    </div>
  </div>;
}
