import { Link } from "react-router-dom";

function Header() {
  return(
    <header className="header">
      <h1 className="header__title"><Link to="/">FastGame</Link></h1>
      <nav className="header__nav">
        <li className="header__li"><a></a>acceuil</li>
        <li className="header__li"><a></a>jeux</li>
        <li className="header__li"><a></a>actualiter</li>
        <li className="header__li"><a></a>Nouveautes</li>
      </nav>
      <div className="header__links">
        <Link to="/register">s'inscrire</Link>
        <Link to="/login">connexion</Link>
      </div>
    </header>
  )
}

export default Header;
