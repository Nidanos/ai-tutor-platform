function LearningJourney() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-48 overflow-hidden lg:block xl:h-56"
        >
            {/* Decorative text */}
            <p className="absolute bottom-20 left-5 -rotate-12 text-xs italic leading-5 text-indigo-200 xl:bottom-24 xl:text-sm">
                Small steps.
                <br />
                Big progress.
            </p>

            {/* Mountain illustration */}
            <div className="absolute bottom-0 left-1/2">
                <div className="absolute bottom-0 left-[-110px] h-0 w-0 border-x-[110px] border-b-[175px] border-x-transparent border-b-indigo-600/70 xl:left-[-135px] xl:border-x-[135px] xl:border-b-[210px]" />

                <div className="absolute bottom-0 left-[-72px] h-0 w-0 border-x-[72px] border-b-[135px] border-x-transparent border-b-violet-500/80 xl:left-[-90px] xl:border-x-[90px] xl:border-b-[165px]" />

                <div className="absolute bottom-3 left-[-2px] h-32 w-1 rotate-[12deg] rounded-full bg-gradient-to-t from-white/90 to-violet-300 blur-[1px] xl:h-40" />

                {/* Flag */}
                <div className="absolute bottom-[130px] left-4 h-8 w-0.5 bg-violet-300 xl:bottom-[165px]" />

                <div className="absolute bottom-[148px] left-4 h-5 w-5 bg-violet-400 [clip-path:polygon(0_0,100%_15%,100%_100%,0_75%)] xl:bottom-[183px]" />
            </div>

            {/* Floating labels */}
            <span className="absolute bottom-12 left-[30%] rounded-xl border border-white/10 bg-white/20 px-3 py-2 text-[11px] text-white backdrop-blur-md xl:left-[34%] xl:text-xs">
                Real skills
            </span>

            <span className="absolute bottom-24 left-[40%] rounded-xl border border-white/10 bg-white/20 px-3 py-2 text-[11px] text-white backdrop-blur-md xl:bottom-28 xl:left-[43%] xl:text-xs">
                More confidence
            </span>

            <span className="absolute bottom-16 right-[4%] rounded-xl border border-white/10 bg-white/20 px-3 py-2 text-[11px] text-white backdrop-blur-md xl:right-[5%] xl:text-xs">
                Greater opportunities
            </span>
        </div>
    );
}

export default LearningJourney;