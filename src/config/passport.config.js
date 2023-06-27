import passport from 'passport'
import local, {Strategy} from 'passport-local'
import userModel from '../dao/models/users.model.js'
import { createHash, isValidPassword } from '../utils.js'
import GithubModel from '../dao/models/github.model.js'
import GitHubStrategy from 'passport-github2'
import dotenv from 'dotenv'

dotenv.config()

const LocalStrategy = local.Strategy

const initializePassport = () => {

    passport.use(
        "register",
        new LocalStrategy (
            {
                passReqToCallback: true,
                usernameField: 'email',
            },
            async (req, username, password, done) => {
                const {first_name, last_name, age, email} = req.body

                try {
                    const user = await userModel.findOne({email: username})

                    if (user) {
                        console.log("El usuario ya existe")
                        return done(null, false)
                    }

                    const hashedPassword = createHash(password)

                    const newUser = {
                        first_name,
                        last_name,
                        age,
                        email,
                        password: hashedPassword,
                    }

                    const result = await userModel.create(newUser)
                    return done (null, result)
                } catch (err) {
                    return done('Error en la contraseña' + err)
                }
            }
        )
    )

    passport.use(
        "github",
        new GitHubStrategy(
            {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                callbackURL: "http://localhost:8080/api/session/githubcallback"
            },
            async(accessToken, refreshToken, profile, done) => {
                console.log(profile)

                try {
                    const user = await userModel.findOne({email: profile._json.email})
                    if (user) return done(null, user)
                    const newUser = await userModel.create({
                        first_name: profile._json.name,
                        email: profile._json.email
                    })
                    return done(null, newUser)
                } catch(err) {
                    console.log('Error to login with github' + err)
                }
            }
        )
    )

    passport.use(
        "login",
        new LocalStrategy(
            {
                usernameField: 'email',
            },
            async(username, password, done) => {
                try {
                    const user = await userModel.findOne({email: username})
                    if(!user) {
                        console.log('El usuario ingresado no existe')
                        return done(null, false)
                    }

                    if(!isValidPassword(user, password)) {
                        return done(null, false)
                    }

                    return done(null, user)
                } catch(err) {
                    done("error", err)
                }
            }
        )
    )


    passport.serializeUser((user, done) => {
        return done (null, user_id)
    })

    passport.deserializeUser(async(id, done) =>{
        const user = await userModel.findById(id)
        return done(null, user)
    })
}

export default initializePassport