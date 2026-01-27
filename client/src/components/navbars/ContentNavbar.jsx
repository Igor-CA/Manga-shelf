import { NavLink } from "react-router-dom";
import "./ContentNavbar.css"; 

export default function ContentNavbar({ links }) {
  return (
    <div className="content-navbar">
      <nav className="">
        <ul className="content-navbar__list">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end} 
                className={({ isActive }) =>
                  isActive
                    ? "content-navbar__link content-navbar__link--active"
                    : "content-navbar__link"
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}