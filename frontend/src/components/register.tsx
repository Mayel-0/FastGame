function Register() {
  return (
    <section>
      <form>
        <label>email</label>
        <input name="email" id="email" type="text"/>
        <label>mot de passe</label>
        <input name="password" id="password" type="password"/>
        <label>username</label>
        <input name="username" id="username" type="text"/>
      </form>
    </section>
  );
}

export default Register;
