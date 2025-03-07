# install the mkcert tool first.
# For windows, just run the commands from powershell

# To install root certificate, run the following command
# mkcert -install 

# These certs can be manually uploaded to NPM to enable https on localhost

mkcert editor.localhost 127.0.0.1 ::1
mkcert staging.localhost 127.0.0.1 ::1
mkcert production.localhost 127.0.0.1 ::1