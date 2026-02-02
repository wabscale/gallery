I want you to create a photo gallery web application.

This application should have a flask backend with a reactjs frontend. 
It should be deployed via docker compose, using a traefik edge router. 
It should use a mariadb to store all data other than the images.
There should also be a redis cache used to cache things like thumbnails.
For the actual image files, those should exist only on the filesystem. Metadata about those files can be in the database.

It should have a publicly facing page with public galleries. 
Each gallery should have a name, that translates to a url path `/gallery/<noramlized gallery name>`
There should also be able to make private galleries that are not listed on the main page. 
These should optionally have a password to access. 
That password should be saved in the frontend if entered correctly, and used in future requests for that web session to retrieve the images.

Galleries should display thumbnails by default, but have the ability to be clicked on for the full resolution image, with download button, and carosel features to go to the next/previous images.
There should also be a download all button at the top that can be enabled or disabled for the gallery. 
This should download a zip file of all the files in the gallery. 
This should be an async action as zipping on the backend may be costly.
All downloads should be logged to a logfile.

The gallery web page should be smart about loading. 
Only the images currently in view should be loaded. 
Id est: they should lazy load. 
They should only load thumbnails. 
You should put in special logic to calculate thumbnail sizes in a sensible way that doesn't 

To manage the site, I want there to be an `/admin` side of the website where admins can login, manage galleries and their settings, upload, see some metrics etc.
For managing the specific galleries, list them with a material ui v7 data-grid. When clicked, it should go to a details page with all relevant settings, and some stats.
To create new galleries or adding new images to existing galleries, the uploading processing should be sleek and modern.
The number of files and size of those files uploaded can be in the hundred, and many MiB a piece, so I want you to make this seamless and reliable.
The user should see the status of uploads similar to google drive uploads.

There should be the ability to have multiple admin accounts. 
When resources are created like galleries, they should be marked as owned by that admin.
There should be a logfile of actions taken by specific admins any time anything is added, edited, deleted or otherwise

I want you to add an option for galleries to be "thumbnail only" and/or "watermark only". 
That watermark/thumbnail quality should be something that can be specified for the user.

# backend

The backend should be an api. All data routes should start with /api. All image routes can start with /images/. Update the traefik path rules to handle these

Initialize the backend as a modern pyproject.toml project with python uv. Use version 3.14

The backend should use the latest version of flask. 
Authentication for admins should be handled with flask-login and flask-bcrypt. 
flask-compress should be used for all static files.
flask-caching should be used to cache thumbnails.
It should run gunicorn with recommended settings for
flask-sqlalchemy should be used for all database operations.

Images should be saved in a mounted `/app/data` directory.
The database should be initialized with `db.create_all()` on startup.

Add a cli.py for doing specific actions like creating admin accounts.

Add pytest unit tests, and integration tests to all relevant areas.

# frontend

The frontend should use material ui. 
It should use the latest version v7. 
Use proper material ui design standards everywhere.
Use a react router to make the web page not have to ever fully reload.

# deployment 

Use the latest traefik edge router configured for docker, acme letsencrypt. Leave the domain used, and the acme email address to be passed in via a .env file. Default these to blank strings
Add a debug docker compose override file for debugging that changes the traefik to use just port 80 and no ssl. 
The override file should also add flask debugging, and react debugging possible. The system this debugs on will always be linux with uid 1000.

Add a justfile with relevant targets for tests, building, deployment, etc.

Set the timezones of all dockerfile images to America/New_York. Create an app user of uid 1000

# backups

Add a justfile target for backing up the application. 
This should be a mariadb backup, and tar.gz (use pigz for this) file in each backup. 
They can just be parked in the current working directory with a date timestamp in the file.

# Misc instructions 

- When you do make summary documents, put them as markdown files with mermaid graphs in the ./docs directory
- Do not need to create summary documents unless I ask
- When adding any new dependencies, libraries or technologies, do web searches to verify you are using the latest versions
- Do not use emojis
- Do not write api endpoints with try-catches that fail silently. Let errors bubble up
- Try to limit functions to no more than 50 lines
