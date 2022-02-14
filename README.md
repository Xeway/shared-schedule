# shared-schedule
A shared schedule website.

This website was originally in a private repo for a client. I decided to fork it and make it public strengthen my "CV" lol.
This website is basically a shared schedule (everything is in the name lmao). More precisely, the users can create an event for a specific day and have to choose another users + a specific place.
The admin can reject or accept that event. He also can add some "special days", these days are on Monday, and basically this day you can have multiple events (like saturday).
I know, it's very difficilt to understand and pretty fuzzy, but I can't tell more because it's originally a private project.

All of the passwords and usernames etc... are located in the dotenv file.

Use 'npm run start' to launch the server. It's opened at the port 8080.
Use 'npm run dev' to also launch the server, but also, everytime you save a change, it will restart it and build the new css.
Use 'npm run buildcss' to build the css.
Use 'npm run minifycss' to minify the css.

Btw for the css, I have used TailWind.
For the server, Express along with EJS (Embedded JavaScript templating) are used.

A MongoDB database is used to store the events, so if you want to test the code, you'll have to install it locally or use MongoDB Atlas.
When the admin accept or reject the event, an email is sent to the two peoples mentionned in the events : it will not work unless you modify the dotenv file and you insert true emails.

Ewan--
