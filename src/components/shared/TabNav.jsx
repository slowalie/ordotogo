import { NotifBadge, BiIcon } from './UI';

export default function TabNav({ tabs, active, onChange }) {
  return (
    <nav className="tabnav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={"tabnav-btn" + (active === tab.id ? ' active' : '')}
        >
          {tab.icon && <BiIcon name={tab.icon} size={15} />}
          {tab.label}
          {tab.badge > 0 && <NotifBadge count={tab.badge} />}
        </button>
      ))}
    </nav>
  );
}
