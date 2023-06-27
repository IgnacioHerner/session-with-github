import express from 'express'
import handlebars from 'express-handlebars'
import mongoose from 'mongoose'
import MongoStore from 'connect-mongo'
import session from 'express-session'
import passport from 'passport'
import dotenv from 'dotenv'

import initializePassport from './config/passport.config.js'
import productsRouter from './routes/products.routes.js'
import cartsRouter from './routes/carts.routes.js'
import viewsRouter from './routes/view.routes.js'
import sessionRouter from './routes/session.routes.js'

mongoose.set('strictQuery', false)
dotenv.config()

const app = express()


app.use(
    session({
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            dbName: process.env.MONGO_DB_NAME
        }),
        secret: 'c0der',
        resave: true,
        saveUninitialized: true
    })
)

initializePassport()
app.use(passport.initialize())
app.use(passport.session())

// ? Middleware en una aplicación web para asegurarse de que un usuario esté autenticado antes de permitir el acceso a determinadas rutas o funcionalidades.
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticaed()){
        return next()
    }
    res.redirect('/api/session/login')
}

// ? JSON SETUP
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// ? HANDLEBARS SETUP
app.engine('handlebars', handlebars.engine())
app.set('views', './src/views')
app.set('view engine', 'handlebars')

// ? ROUTER SETUP
app.use('/api/products', ensureAuthenticated, productsRouter)
app.use('/api/carts', ensureAuthenticated, cartsRouter)
app.use('/api/session', sessionRouter)
app.use('/products', viewsRouter)

// ? MONGOOSE AND SERVER
mongoose
    .connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB_NAME,
    })
    .then(() => {
        console.log('DB connected!')
    })
    .catch((err) =>{
        console.log("DB connection error:", err)
    })

app.listen(8080, () => console.log('Server up!'));