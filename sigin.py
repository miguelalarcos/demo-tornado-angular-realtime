from oauth2client import client, crypt


def sigin(token):
  idinfo = client.verify_id_token(token, '722958880410-7i9qpud2jbhgv7pn2ajsqimljssrq0jj.apps.googleusercontent.com')

  #if idinfo['aud'] not in ['722958880410-7i9qpud2jbhgv7pn2ajsqimljssrq0jj.apps.googleusercontent.com']:
  #    raise crypt.AppIdentityError("Unrecognized client.")

  if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
      # raise crypt.AppIdentityError("Wrong issuer.")
      return None

  # userid = idinfo['sub']
  return idinfo['email']
