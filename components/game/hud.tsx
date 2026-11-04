      {/* ป้ายโปรไฟล์มุมซ้ายบน พร้อมระบบพับหน้าต่าง */}
      <div className="pixel-panel absolute left-2 top-2 z-20 w-[min(14rem,calc(100vw-1rem))] p-2 shadow-lg md:left-3 md:top-3">
        {/* แถบหัวข้อชื่อตัวละคร + ปุ่มกดพับ (คลิกได้ทั้งแถบ) */}
        <div 
          onClick={() => setIsOpenProfile(!isOpenProfile)}
          className="flex cursor-pointer items-center justify-between gap-1 select-none"
        >
          <div className="flex items-center gap-1.5 truncate">
            <p className="truncate text-xs font-semibold text-foreground">
              {p.gm && <span className="mr-1 text-gold">[GM]</span>}
              {p.name}
            </p>
            <p className="shrink-0 text-[10px] text-primary">
              Lv.{p.level} {job.name}
            </p>
          </div>
          <button type="button" aria-label="พับโปรไฟล์" className="p-0.5 hover:opacity-80">
            {isOpenProfile ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

        {/* ส่วนหลอดพลัง HP/MP/EXP และ เงิน G จะแสดงผลเมื่อ isOpenProfile เป็น true */}
        {isOpenProfile && (
          <div className="mt-1.5 border-t border-border/60 pt-1.5">
            <div className="flex flex-col gap-0.5">
              <Bar label="HP" value={p.hp} max={s.maxHp} color="bg-hp" />
              <Bar label="MP" value={p.mp} max={s.maxMp} color="bg-mp" />
              <Bar label="EXP" value={p.level >= MAX_LEVEL ? need : p.exp} max={need} color="bg-exp" />
            </div>
            <p className="mt-1 text-[11px] text-gold">{formatNum(p.gold)} G</p>
          </div>
        )}
      </div>
