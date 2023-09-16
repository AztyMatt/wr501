import EventEmitter from './EventEmitter.js'

export default class Time extends EventEmitter
{
    constructor()
    {
        super()

        // Setup
        this.start = Date.now()
        this.current = this.start
        this.delta = 16 //Peut provoquer des bugs si on le set a 0
        this.elapsed = 0

        window.requestAnimationFrame(() => 
        {
            this.tick()
        })
    }   
    
    tick()
    {
        const currentTime = Date.now()
        this.delta = currentTime - this.current
        this.current = currentTime
        this.elapsed = this.current - this.start

        this.trigger('tickEvent')

        window.requestAnimationFrame(() => 
        {
            this.tick()
        })
    }
}