// LFAI 공통 스크립트: 메뉴, 첫 화면 예시, 문의 폼
// 상담 접수 엔드포인트(Formspree 또는 Google Apps Script). 비어 있으면 메일 초안으로 대신합니다.
var FORM_ENDPOINT = "";
(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 메뉴
  var burger = document.querySelector(".burger"), nav = document.getElementById("nav");
  if(burger && nav){
    burger.addEventListener("click", function(){
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });
  }

  // 영상: 움직임 줄이기면 멈춘 그림만
  document.querySelectorAll("video[data-auto]").forEach(function(v){
    if(reduce){ v.removeAttribute("autoplay"); v.pause(); return; }
    var p = v.play(); if(p && p.catch) p.catch(function(){});
  });

  // 첫 화면 예시: 지시 → 계획 → 사전 검증 → 승인 → 실행
  var say = document.getElementById("saytext");
  if(say){
    var data = [
      {say:"지난주 민원 중에 주차 관련만 모아서 담당자별로 정리해 줘",
       steps:[["계획","조회 → 분류 → 담당자별 정리 절차 작성",""],["검증","사전 검증 통과 · 조회 범위와 권한 확인","G"],
              ["실행","민원 시스템 조회","1,284건"],["실행","주차 관련 분류","213건"],["실행","담당자별 정리","4개 부서"]],
       done:"보고서 초안 완료 · 실행 기록 저장"},
      {say:"이번 주 신규 영상 3편 검수하고, 통과한 것만 발행 예약해 줘",
       steps:[["계획","검수 체크리스트 → 발행 예약 절차 작성",""],["검증","사전 검증 통과 · 채널 권한과 예약 시간 확인","G"],
              ["실행","자막·음량·규격 검수","3편"],["실행","검수 통과","2편"],["실행","발행 예약 · 반려 사유 기록","2건 · 1건"]],
       done:"발행 예약 완료 · 제작 이력 저장"},
      {say:"인터뷰 전사본 40건 1차 코딩하고, 코더 간 불일치만 모아 줘",
       steps:[["계획","코딩북 확인 → 1차 코딩 → 불일치 추출 절차 작성",""],["검증","사전 검증 통과 · 개인정보 비식별 확인","G"],
              ["실행","전사본 1차 코딩","40건"],["실행","코더 간 불일치 추출","7건"],["실행","연구자 검토 목록 작성","1건"]],
       done:"검토 목록 완료 · 분석 이력 저장"},
      {say:"내일 오전 3층 회의실 냉방 미리 켜고, 방문객 출입 등록해 줘",
       steps:[["계획","일정 확인 → 냉방 예약 → 출입 등록 절차 작성",""],["검증","사전 검증 통과 · 온도 범위와 출입 권한 확인","G"],
              ["실행","냉방 예약","08:30 · 24℃"],["실행","방문객 출입 등록","4명"],["실행","담당자 안내","1건"]],
       done:"예약·등록 완료 · 실행 기록 저장"}
    ];
    var list = document.getElementById("steps"), ok = document.getElementById("okbox"),
        okText = document.getElementById("oktext"), okBtn = document.getElementById("okbtn"), timers = [], cur = 0, auto = !reduce;
    var later = function(fn, ms){ timers.push(setTimeout(fn, ms)); };
    var clear = function(){ timers.forEach(clearTimeout); timers = []; };
    var tabs = document.querySelectorAll(".dtabs button");
    [].forEach.call(tabs, function(t){ t.addEventListener("click", function(){ auto = false; show(+t.dataset.i); }); });
    var show = function(i){
      clear(); cur = i; var d = data[i];
      [].forEach.call(tabs, function(t, j){ t.setAttribute("aria-selected", j === i ? "true" : "false"); });
      list.innerHTML = d.steps.map(function(s){
        var g = s[2] === "G";
        return '<li class="' + (g ? "chk" : "") + '"><b>' + (g ? "◆" : "✓") + '</b><span>' + s[0] + ' · ' + s[1] + '</span><em>' + (g ? "" : s[2]) + '</em></li>';
      }).join("");
      var items = list.querySelectorAll("li");
      ok.classList.remove("on"); okBtn.disabled = false; okBtn.textContent = "승인";
      var approve = function(){
        clear(); okBtn.disabled = true; okBtn.textContent = "승인됨"; var k = 2;
        (function run(){
          if(k < items.length){ items[k++].classList.add("on"); later(run, 480); }
          else { okText.textContent = d.done; okBtn.textContent = "완료"; if(auto) later(function(){ show((cur + 1) % data.length); }, 3400); }
        })();
      };
      okBtn.onclick = function(){ auto = false; approve(); };
      if(reduce){ say.textContent = d.say; items.forEach(function(li){ li.classList.add("on"); }); okText.textContent = d.done; okBtn.textContent = "완료"; okBtn.disabled = true; ok.classList.add("on"); return; }
      say.textContent = ""; var n = 0;
      (function type(){
        if(n <= d.say.length){ say.textContent = d.say.slice(0, n++); later(type, 36); return; }
        later(function(){ items[0].classList.add("on"); }, 300);
        later(function(){ items[1].classList.add("on"); }, 900);
        later(function(){ okText.textContent = "사전 검증 통과 · 승인하면 실행됩니다"; ok.classList.add("on"); if(auto) later(approve, 1500); }, 1300);
      })();
    };
    show(0);
  }

  // 문의 폼
  var wiz = document.getElementById("wiz");
  if(wiz){
    var step = 0, qs = Array.prototype.slice.call(wiz.querySelectorAll(".q")).slice(0, 4),
        meta = document.getElementById("wizmeta"), prog = document.getElementById("wizprog"),
        prev = document.getElementById("wizprev"), next = document.getElementById("wiznext"), err = document.getElementById("wizerr");
    var picked = function(g){ return Array.prototype.map.call(g.querySelectorAll('[aria-pressed="true"]'), function(b){ return b.textContent.trim(); }); };
    var val = function(id){ var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var draw = function(){
      qs.forEach(function(q, i){ q.classList.toggle("on", i === step); });
      meta.textContent = (step + 1) + " / 4"; prog.style.width = ((step + 1) * 25) + "%";
      prev.disabled = step === 0; next.textContent = step === 3 ? "상담 신청" : "다음"; err.textContent = "";
    };
    wiz.querySelectorAll(".opts").forEach(function(g){
      g.addEventListener("click", function(e){
        var b = e.target.closest("button"); if(!b) return;
        if(g.getAttribute("data-mode") === "single"){ g.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); }
        else b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
      });
    });
    var check = function(){
      if(step === 0 && !picked(qs[0].querySelector(".opts")).length) return "기관 유형을 선택하세요.";
      if(step === 1 && !picked(qs[1].querySelector(".opts")).length) return "필요한 범위를 하나 이상 고르세요.";
      if(step === 3){
        if(!val("wizname")) return "이름을 입력하세요.";
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("wizmail"))) return "이메일 주소를 입력하세요.";
        if(!document.getElementById("wizagree").checked) return "개인정보 수집에 동의해야 접수할 수 있습니다.";
      }
      return "";
    };
    var payload = function(){
      return {"고객 유형": picked(qs[0].querySelector(".opts")).join(", "), "필요 범위": picked(qs[1].querySelector(".opts")).join(", "),
              "규모": val("wizscale") || "-", "희망 시기": val("wizwhen") || "-", "이름": val("wizname"), "소속": val("wizorg") || "-",
              "이메일": val("wizmail"), "전화": val("wizphone") || "-", "메모": val("wiznote") || "-"};
    };
    var done = function(){
      qs.forEach(function(q){ q.classList.remove("on"); });
      document.getElementById("wizok").classList.add("on");
      document.getElementById("wizbar").style.display = "none";
      document.getElementById("wizfine").style.display = "none";
      prog.style.width = "100%";
    };
    var mail = function(d){
      var body = Object.keys(d).map(function(k){ return k + ": " + d[k]; }).join("\n");
      document.getElementById("wizokh").textContent = "마지막 단계입니다.";
      document.getElementById("wizokp").textContent = "아래 내용을 메일로 보내 주시면 접수가 끝납니다. 진단 상담을 준비해 회신드립니다.";
      document.getElementById("wizsum").textContent = body;
      document.getElementById("wizmailto").href = "mailto:contact@carusworks.com?subject=" + encodeURIComponent("LFAI 도입 상담") + "&body=" + encodeURIComponent(body);
      document.getElementById("wizmailbox").hidden = false;
      var cp = document.getElementById("wizcopy");
      cp.onclick = function(){
        var ok = function(){ cp.textContent = "복사했습니다"; };
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText("받는 곳: contact@carusworks.com\n제목: LFAI 도입 상담\n\n" + body).then(ok, function(){ cp.textContent = "직접 선택해 복사해 주세요"; }); }
        else cp.textContent = "직접 선택해 복사해 주세요";
      };
      done();
    };
    prev.addEventListener("click", function(){ if(step > 0){ step--; draw(); } });
    next.addEventListener("click", function(){
      var m = check(); if(m){ err.textContent = m; return; }
      if(step < 3){ step++; draw(); return; }
      var d = payload();
      if(!FORM_ENDPOINT){ mail(d); return; }
      next.disabled = true; next.textContent = "보내는 중…";
      fetch(FORM_ENDPOINT, {method:"POST", headers:{"Accept":"application/json","Content-Type":"application/json"}, body:JSON.stringify(d)})
        .then(function(r){ if(!r.ok) throw new Error(r.status); done(); })
        .catch(function(){ next.disabled = false; next.textContent = "상담 신청"; err.textContent = "전송하지 못했습니다. 잠시 후 다시 시도하거나 contact@carusworks.com 으로 보내 주세요."; });
    });
    draw();
  }
})();

// 아키텍처 탐색기: 계층 펼치기 + 지시 하나가 흐르는 길
(function(){
  var cmx = document.getElementById("cmx");
  if(!cmx) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rows = Array.prototype.slice.call(cmx.querySelectorAll(".cmx-l, .cmx-link"));
  cmx.querySelectorAll(".cmx-l > button").forEach(function(b){
    b.addEventListener("click", function(){
      var li = b.parentNode, open = !li.classList.contains("open");
      cmx.querySelectorAll(".cmx-l.open").forEach(function(o){ o.classList.remove("open"); o.querySelector("button").setAttribute("aria-expanded", "false"); });
      if(open){ li.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
    });
  });
  var steps = [
    ["svc", "① 담당자가 '에너지·환경 제어' 서비스에 요청을 입력합니다."],
    ["mcp", "② 요청은 표준 프로토콜(MCP)을 통해 에이전트로 전달됩니다. 어떤 시스템이든 같은 방식으로 연동됩니다."],
    ["agt", "③ 에너지 최적화 에이전트(A3)가 업무를 맡고, 공간 지능 에이전트(A4)에 내일 재실 예측을 요청합니다(A2A)."],
    ["orc", "④ 사내 서버의 소형 모델(SLM)이 실행 절차를 작성합니다. 온톨로지에서 '3층 회의실 – 냉방기 2대' 관계를 조회하고, 고난도 판단만 대형 모델(LLM)에 맡깁니다."],
    ["dat", "⑤ 회의 일정·재실·온습도·장비 상태 데이터를 표준 규격으로 조회합니다."],
    ["svc", "⑥ 가상 환경 사전 검증과 담당자 승인을 거쳐 냉방이 예약되고, 결과와 이력이 서비스 화면에 표시됩니다.", "done"]
  ];
  var dot = cmx.querySelector(".cmx-dot"), play = document.getElementById("cmxplay"), timers = [], ran = false;
  var clear = function(){ timers.forEach(clearTimeout); timers = []; };
  var row = function(k){ return cmx.querySelector('[data-l="' + k + '"]'); };
  var reset = function(){ rows.forEach(function(r){ r.classList.remove("lit", "past", "done"); var c = r.querySelector(".cmx-cap"); if(c) c.textContent = ""; }); dot.style.opacity = 0; dot.classList.remove("back"); };
  var go = function(i){
    var s = steps[i], r = row(s[0]);
    rows.forEach(function(x){ if(x.classList.contains("lit")){ x.classList.remove("lit"); x.classList.add("past"); } });
    if(s[2]){ r.classList.add("done"); dot.classList.add("back"); }
    r.classList.remove("past"); r.classList.add("lit");
    r.querySelector(".cmx-cap").textContent = s[1];
    dot.style.opacity = 1; dot.style.top = (r.offsetTop + (r.classList.contains("cmx-link") ? 18 : 30)) + "px";
  };
  var run = function(){
    clear(); reset(); ran = true;
    play.innerHTML = "<i>■</i> 멈춤";
    if(reduce){ steps.forEach(function(_, i){ go(i); }); play.innerHTML = "<i>↻</i> 다시 보기"; return; }
    steps.forEach(function(_, i){ timers.push(setTimeout(function(){ go(i); if(i === steps.length - 1) play.innerHTML = "<i>↻</i> 다시 보기"; }, i * 2600)); });
  };
  play.addEventListener("click", function(){
    if(timers.length && play.textContent.indexOf("멈춤") > -1){ clear(); play.innerHTML = "<i>▶</i> 처음부터 다시"; return; }
    run();
  });
  if("IntersectionObserver" in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && !ran){ run(); io.disconnect(); } }); }, {threshold: .45});
    io.observe(cmx);
  }
})();

/* 결재 요청 시뮬레이터 — 공개 계산식(예시값) */
(function(){
  var r = document.getElementById("dsim"); if(!r) return;
  function $(i){ return document.getElementById(i); }
  var K = {D:$("kD"), P:$("kP"), H:$("kH"), T:$("kT")}, sel = null, best = null;
  var won = function(v){ v = Math.round(v); if(v >= 1e8){ var e = Math.floor(v/1e8), m = Math.round((v%1e8)/1e7)*1000; return e+"억"+(m?" "+m.toLocaleString()+"만":"")+" 원"; } return Math.round(v/1e4).toLocaleString()+"만 원"; };
  var pay = function(cost, save){ var m = cost/save; return m < 24 ? (m < 1 ? "회수 "+Math.max(1,Math.round(m*30))+"일" : "회수 "+m.toFixed(1)+"개월") : "회수 "+(m/12).toFixed(1)+"년"; };
  function calc(){
    var d = +K.D.value/100, P = +K.P.value, H = +K.H.value, T = +K.T.value;
    $("oD").textContent = K.D.value+"%"; $("oP").textContent = P+" kW"; $("oH").textContent = H+"시간"; $("oT").textContent = T+"원/kWh";
    var kwh = P*H*30*d, loss = kwh*T, base = P*H*30*T;
    $("dsLoss").textContent = "월 "+won(loss); $("dsKwh").textContent = "(월 "+Math.round(kwh).toLocaleString()+" kWh 초과 사용)";
    var o = {clean:{c:1.2e6, s:loss*.75}, replace:{c:3.5e8, s:loss+base*.2}};
    $("e1").textContent = pay(o.clean.c, o.clean.s); $("e2").textContent = "점검 1시간"; $("e3").textContent = pay(o.replace.c, o.replace.s);
    var mC = o.clean.c/o.clean.s, mR = o.replace.c/o.replace.s;
    best = d >= .15 && mR < 60 ? "replace" : (d < .04 ? "check" : "clean");
    var why = {clean:"세척 비용이 "+pay(o.clean.c, o.clean.s).replace("회수 ","")+" 안에 회수됩니다. 이번 주 세척을 권고합니다.",
      check:"저하율이 낮아 원인 확인이 먼저입니다. 냉매 압력 점검 후 판단을 권고합니다.",
      replace:"저하 폭이 커서 세척으로는 25%가 남습니다. 교체 회수 기간이 "+(mR/12).toFixed(1)+"년으로 5년 이내여서 교체 검토를 권고합니다."};
    $("dsRec").textContent = "AI 권고 · "+why[best];
    [].forEach.call(r.querySelectorAll(".o"), function(b){ b.classList.toggle("best", b.dataset.k === best); });
    $("dsH").textContent = "냉방 효율 "+K.D.value+"% 저하, 4주 연속";
    var pts = [], n = 8, cop0 = 4.6;
    for(var i=0;i<n;i++){ var w = i < 4 ? 0 : (i-3)/4, cop = cop0*(1 - d*w) + (i%2 ? .04 : -.03); pts.push([i*(300/(n-1)), 32 - (cop-cop0)*(18/(.1*cop0))]); }
    pts = pts.map(function(p){ return [p[0].toFixed(1), Math.max(4, Math.min(60, p[1])).toFixed(1)]; });
    $("dsLine").setAttribute("points", pts.map(function(p){ return p.join(","); }).join(" "));
    $("dsDot").setAttribute("cx", pts[n-1][0]); $("dsDot").setAttribute("cy", pts[n-1][1]);
    upd();
  }
  function upd(){
    var names = {clean:"응축기 세척", check:"냉매 압력 점검", replace:"설비 교체"};
    [].forEach.call(r.querySelectorAll(".o"), function(b){ b.setAttribute("aria-checked", b.dataset.k === sel ? "true" : "false"); });
    $("dsOk").disabled = !sel;
    $("dsSel").textContent = sel ? "선택 · "+names[sel]+(sel !== best ? " (권고와 다름, 사유 기록)" : "") : "조치안을 선택하세요";
  }
  [].forEach.call(r.querySelectorAll(".o"), function(b){ b.addEventListener("click", function(){ sel = b.dataset.k; upd(); }); });
  for(var k in K) K[k].addEventListener("input", calc);
  $("dsOk").addEventListener("click", function(){
    if(!sel) return;
    var t = new Date(), h = 0, src = sel+K.D.value+K.P.value+K.H.value+K.T.value+t.getTime();
    for(var i=0;i<src.length;i++){ h = (h*31 + src.charCodeAt(i)) >>> 0; }
    var ts = t.toTimeString().slice(0,8);
    $("dsLog").textContent = "✓ 승인 기록 "+ts+" · #"+h.toString(16).padStart(8,"0")+" · 계획→검증→승인 이력 저장";
  });
  sel = null; calc();
  /* 처음 보일 때 저하율을 한 번 움직여 숫자·권고가 바뀌는 걸 보여 줌 (손대면 즉시 중단) */
  var touched = false; [].forEach.call(r.querySelectorAll("input,button"), function(el){ el.addEventListener("pointerdown", function(){ touched = true; }); });
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window){
    var io = new IntersectionObserver(function(es){ if(!es[0].isIntersecting) return; io.disconnect();
      var seq = [10,12,14,16,18,18,18,16,14,12,10,8], i = 0;
      var tm = setInterval(function(){ if(touched || i >= seq.length){ clearInterval(tm); return; } K.D.value = seq[i++]; calc(); }, 320);
    }, {threshold: .6});
    io.observe(r);
  }
})();

/* 화면에 보일 때만 재생하는 배경 영상 */
(function(){
  var vs = document.querySelectorAll("video[data-inview]"); if(!vs.length) return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ var v = e.target;
    if(e.isIntersecting){ if(v.preload === "none") v.preload = "auto"; var p = v.play(); if(p && p.catch) p.catch(function(){}); } else v.pause(); }); }, {threshold: .15});
  [].forEach.call(vs, function(v){ io.observe(v); });
})();


/* 모바일 하단 고정 버튼: 첫 화면을 지나면 보이고, 마무리 띠·바닥글에서는 숨김 */
(function(){
  var st = document.getElementById("stick"); if(!st) return;
  var end = document.querySelector("section.close, footer");
  var upd = function(){
    var past = window.scrollY > window.innerHeight * .8;
    var nearEnd = end && end.getBoundingClientRect().top < window.innerHeight;
    st.classList.toggle("on", past && !nearEnd);
  };
  window.addEventListener("scroll", upd, {passive: true}); upd();
})();

/* 첫 화면 배경 영상: 페이지 로드가 끝난 뒤에 받기 시작 (데이터 절약 모드·움직임 줄이기면 포스터만) */
(function(){
  var v = document.querySelector("video[data-late]"); if(!v) return;
  var c = navigator.connection || {};
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches || c.saveData) return;
  v.addEventListener("playing", function(){ v.classList.add("on"); }, {once: true});
  var go = function(){ v.preload = "auto"; v.load(); var p = v.play(); if(p && p.catch) p.catch(function(){}); };
  if(document.readyState === "complete") setTimeout(go, 300); else window.addEventListener("load", function(){ setTimeout(go, 300); });
})();

/* ===== 분야별 운영 앱 — 핵심 3가지(모바일 지시 · 팹 운영 체계 · 경영 보고)를 같은 숫자로 계산 =====
   계산식은 화면 아래에 공개. 기본값은 예시이며 진단 때 현장 값으로 바꾼다. */
(function(){
  var app = document.getElementById("app"); if(!app) return;
  var $ = function(i){ return document.getElementById(i); };
  var won = function(v){ v = Math.round(v); if(v >= 1e8){ var e = Math.floor(v/1e8), m = Math.round((v%1e8)/1e6)*100; return e+"억"+(m ? " "+m.toLocaleString()+"만" : "")+" 원"; } return Math.max(0, Math.round(v/1e4)).toLocaleString()+"만 원"; };
  var payT = function(mo){ if(!(mo > 0) || !isFinite(mo)) return "회수 불가"; if(mo < 1) return Math.max(1, Math.round(mo*30))+"일"; if(mo < 24) return mo.toFixed(1)+"개월"; return (mo/12).toFixed(1)+"년"; };
  var esc = function(t){ return String(t).replace(/</g,"&lt;"); };
  var M = {
    fac: { unit:"냉동기 2호기", lossLabel:"추가 전력비",
      knobs:[["d","효율 저하율",2,20,1,8,"%"],["p","정격 전력",100,1000,50,350," kW"],["h","일 운전 시간",4,24,1,12,"시간"],["t","전력 단가",100,250,10,150,"원/kWh"]],
      loss:function(v){ return v.p*v.h*30*v.d/100*v.t; },
      opts:function(v,L){ var base=v.p*v.h*30*v.t; return [{k:"a",n:"응축기 세척",c:1.2e6,mo:0,s:L*.75,d:"저하분 75% 회복"},{k:"b",n:"냉매 압력 점검",c:1.5e5,mo:0,s:L*.3,d:"원인 확인 후 결정"},{k:"c",n:"설비 교체",c:3.5e8,mo:0,s:L+base*.2,d:"효율 20% 개선"}]; },
      rec:function(v,O){ if(v.d < 4) return "b"; if(v.d >= 15 && O[2].c/O[2].s < 60) return "c"; return "a"; },
      ask:"냉동기 2호기 효율 떨어진 거, 어떻게 할지 정리해 줘",
      tech:function(v){ return "AHU-02 COP 4.6 → "+(4.6*(1-v.d/100)).toFixed(2)+" (−"+v.d+"%)<br>응축 압력 상승 · ΔT 편차 경보 "+Math.max(1,Math.round(v.d/3))+"건"; },
      exec:function(v,L){ return "냉방 2호기 때문에 <b>매달 "+won(L)+"</b>이 더 나갑니다."; },
      kpi:function(v){ return 100-v.d; }, kpiName:"성능 유지율",
      fab:function(v){ return [["레시피","냉방 운전 표준 절차","고정"],["공정 라우팅","점검 → 세척 → 재측정","3단계"],["SPC 관리도","성능계수(COP) 추이","4주 연속 하락"],["수율","성능 유지율",(100-v.d)+"%"],["로트 추적","설비별 조치 이력","전 건 기록"],["표준원가","월 전력비 기준 차이","+"+v.d+"%"]]; },
      formula:"추가 전력비 = 정격 전력 × 일 운전 시간 × 30일 × 저하율 × 전력 단가" },
    con: { unit:"영상 제작 라인", lossLabel:"재작업 비용",
      knobs:[["n","월 제작 편수",10,200,5,40,"편"],["c","편당 제작 원가",10,200,5,30,"만 원"],["r","재작업률",5,50,1,25,"%"]],
      loss:function(v){ return v.n*v.r/100*v.c*1e4*.6; },
      opts:function(v,L){ return [{k:"a",n:"품질 게이트 도입",c:3e6,mo:0,s:L*.6,d:"검수 기준 자동 점검, 재작업 60% 감소"},{k:"b",n:"제작 레시피 표준화",c:8e6,mo:0,s:L*.8,d:"공법 고정, 재작업 80% 감소"},{k:"c",n:"검수 인력 1명 충원",c:0,mo:3.5e6,s:L*.5-3.5e6,d:"재작업 50% 감소"}]; },
      ask:"이번 달 영상 재작업이 왜 이렇게 많은지 보고해 줘",
      tech:function(v){ return "반려 "+Math.round(v.n*v.r/100)+"건 / 제작 "+v.n+"건<br>사유: 자막 오탈자 · 음량 편차 · 썸네일 규격 위반"; },
      exec:function(v,L){ return "재작업 때문에 <b>매달 "+won(L)+"</b>가 새고 있습니다."; },
      kpi:function(v){ return 100-v.r; }, kpiName:"1차 통과율",
      fab:function(v){ return [["레시피","기획·대본·제작·배포 공법","편마다 동일"],["공정 라우팅","편집 → 검수 → 발행","3단계"],["SPC 관리도","재작업률 추이",(v.r > 15 ? "기준 15% 초과" : "기준 이내")],["수율","1차 통과율",(100-v.r)+"%"],["로트 추적","원본 출처·버전 이력","편별 기록"],["표준원가","편당 원가 대비 재작업",""+Math.round(v.c*v.r/100*.6)+"만 원/편"]]; },
      formula:"재작업 비용 = 월 제작 편수 × 재작업률 × 편당 원가 × 60%(재작업에 드는 비중)" },
    res: { unit:"인터뷰·문헌 분석", lossLabel:"재분석 연구 시간",
      knobs:[["n","월 분석 자료 수",50,500,10,200,"건"],["h","건당 분석 시간",1,8,.5,3,"시간"],["r","재분석 비율",5,60,1,30,"%"],["w","연구 인력 시간당 비용",2,8,.5,3,"만 원"]],
      loss:function(v){ return v.n*v.r/100*v.h*v.w*1e4; },
      opts:function(v,L){ return [{k:"a",n:"코딩북·분석 프로토콜 표준화",c:5e6,mo:0,s:L*.5,d:"재분석 50% 감소"},{k:"b",n:"AI 1차 코딩 + 연구자 검수",c:1.2e7,mo:0,s:L*.8,d:"재분석 80% 감소, 판단은 연구자"},{k:"c",n:"연구보조원 1명 충원",c:0,mo:2.5e6,s:L*.4-2.5e6,d:"재분석 40% 감소"}]; },
      ask:"이번 학기 인터뷰 분석 진행 상황이랑 병목 정리해 줘",
      tech:function(v){ return "전사본 "+v.n+"건 중 재코딩 "+Math.round(v.n*v.r/100)+"건<br>코더 간 일치도 κ = "+(0.86-v.r/250).toFixed(2); },
      exec:function(v,L){ return "재분석에 <b>매달 "+won(L)+"</b>어치 연구 시간이 쓰입니다."; },
      kpi:function(v){ return 100-v.r; }, kpiName:"1차 코딩 통과율",
      fab:function(v){ return [["레시피","연구 프로토콜·코딩북","자료마다 동일"],["공정 라우팅","수집 → 전사 → 코딩 → 분석","4단계"],["SPC 관리도","코더 간 일치도 추이","κ "+(0.86-v.r/250).toFixed(2)],["수율","1차 코딩 통과율",(100-v.r)+"%"],["로트 추적","자료 출처·인용·분석 이력","건별 기록"],["표준원가","건당 분석 시간 기준",v.h+"시간/건"]]; },
      formula:"재분석 연구 시간 = 월 분석 자료 수 × 재분석 비율 × 건당 분석 시간 × 시간당 비용" },
    pub: { unit:"민원 처리", lossLabel:"반복 문의 처리 시간",
      knobs:[["n","월 민원 건수",300,5000,100,1200,"건"],["m","건당 처리 시간",5,60,1,20,"분"],["r","반복 문의 비율",10,70,1,40,"%"],["w","시간당 업무 비용",2,6,.5,3,"만 원"]],
      loss:function(v){ return v.n*v.r/100*v.m/60*v.w*1e4; },
      opts:function(v,L){ return [{k:"a",n:"자동 답변 초안 + 담당자 검토",c:9e6,mo:0,s:L*.6,d:"반복 문의 처리 60% 단축"},{k:"b",n:"민원 분류 에이전트",c:6e6,mo:0,s:L*.35,d:"담당 배정 자동화, 35% 단축"},{k:"c",n:"상담 인력 1명 충원",c:0,mo:3e6,s:L*.3-3e6,d:"반복 문의 30% 단축"}]; },
      ask:"지난달 반복 민원 정리하고 줄일 방법 알려 줘",
      tech:function(v){ return "민원 "+v.n.toLocaleString()+"건 · 평균 처리 "+v.m+"분<br>동일 유형 재문의 "+Math.round(v.n*v.r/100).toLocaleString()+"건"; },
      exec:function(v,L){ return "같은 질문에 답하느라 <b>매달 "+won(L)+"</b>어치 업무 시간이 쓰입니다."; },
      kpi:function(v){ return 100-v.r; }, kpiName:"1회 처리 완결률",
      fab:function(v){ return [["레시피","민원 유형별 처리 절차","유형마다 동일"],["공정 라우팅","접수 → 분류 → 답변 → 검토","4단계"],["SPC 관리도","유형별 재문의율 추이",(v.r > 30 ? "기준 30% 초과" : "기준 이내")],["수율","1회 처리 완결률",(100-v.r)+"%"],["로트 추적","민원별 처리·승인 이력","건별 기록"],["표준원가","건당 처리 시간 기준",v.m+"분/건"]]; },
      formula:"반복 문의 처리 시간 = 월 민원 건수 × 반복 문의 비율 × 건당 처리 시간 × 시간당 비용" }
  };
  var cur = "fac", V = {}, sel = null, approved = null, touched = false;
  var tabs = app.querySelectorAll(".stabs button");
  function build(){
    var m = M[cur]; V = {};
    $("appKnobs").innerHTML = m.knobs.map(function(k){ V[k[0]] = k[5];
      return '<label><span>'+k[1]+'</span><output id="ko-'+k[0]+'"></output><input type="range" data-k="'+k[0]+'" min="'+k[2]+'" max="'+k[3]+'" step="'+k[4]+'" value="'+k[5]+'"></label>'; }).join("");
    [].forEach.call($("appKnobs").querySelectorAll("input"), function(i){ i.addEventListener("input", function(){ V[i.dataset.k] = +i.value; approved = null; calc(); }); i.addEventListener("pointerdown", function(){ touched = true; }); });
    [].forEach.call(tabs, function(t){ t.setAttribute("aria-selected", t.dataset.s === cur ? "true" : "false"); });
    sel = null; approved = null; calc();
  }
  function calc(){
    var m = M[cur], L = m.loss(V), O = m.opts(V, L);
    m.knobs.forEach(function(k){ var o = $("ko-"+k[0]); if(o) o.textContent = (+V[k[0]]).toLocaleString()+k[6]; });
    O.forEach(function(o){ o.pm = o.s > 0 ? (o.c > 0 ? o.c/o.s : 0.0001) : Infinity; o.pt = o.c > 0 || o.mo > 0 ? (o.s > 0 ? (o.c > 0 ? "회수 "+payT(o.pm) : "월 "+won(o.s)+" 절감") : "회수 불가") : ""; });
    O.forEach(function(o){ o.y1 = o.s*12 - o.c; });  // 1년 순효과 = 월 절감 × 12 − 초기 비용
    var best = m.rec ? m.rec(V, O) : O.slice().sort(function(a,b){ return b.y1 - a.y1; })[0].k;
    var B = O.filter(function(o){ return o.k === best; })[0];
    $("appUnit").textContent = m.unit+" · "+m.lossLabel; $("appLoss").textContent = "월 "+won(L);
    // 01 모바일 지시·승인
    var noneC = !(B.s*12 - B.c >= 0 || B.s*60 - B.c >= 0);
    var chat = '<p class="me">'+m.ask+'</p><p class="ai"><small>LFAI</small>'+m.kpiName+' '+m.kpi(V)+'% · '+m.lossLabel+' 월 '+won(L)+'<br>'+(noneC ? '권고: 투자 보류 · 손실 규모가 작아 지표만 계속 봅니다' : '권고: '+B.n+' ('+(B.pt||"")+')')+'<br>승인하면 실행 절차를 시작합니다.<span class="bt"><button type="button" data-a="ok">승인</button><button type="button" data-a="hold">보류</button></span></p>';
    if(approved) chat += '<p class="me">'+(approved.a === "ok" ? "승인" : "보류")+'</p><p class="ai ok"><small>LFAI</small>'+(approved.a === "ok" ? "✓ "+approved.n+" 실행 절차 시작 · 이력 #"+approved.h : "보류 기록 · 다음 주 같은 지표로 다시 보고합니다")+'</p>';
    $("appChat").innerHTML = chat + '<figcaption>예시 화면 · 숫자는 위 입력값으로 계산</figcaption>';
    // 02 팹 대응표
    var k = m.kpi(V), pts = [], n = 8;
    for(var i=0;i<n;i++){ var w = i < 4 ? 0 : (i-3)/4, y = 100 - (100-k)*w + (i%2 ? .6 : -.5); pts.push((i*300/(n-1)).toFixed(1)+","+(10+(100-y)*1.1).toFixed(1)); }
    $("appFab").innerHTML = '<table><thead><tr><th scope="col">반도체 팹</th><th scope="col">'+m.unit+' 운영</th><th scope="col">지금 값</th></tr></thead><tbody>'
      + m.fab(V).map(function(r){ return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td class="v">'+r[2]+'</td></tr>'; }).join("")
      + '</tbody></table><div class="spark2"><svg viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="16" x2="300" y2="16"/><polyline points="'+pts.join(" ")+'"/></svg><span>관리도 · 최근 8주 '+m.kpiName+'</span></div>';
    // 03 경영 보고
    var r = '<div class="old"><small>일반 시스템 보고</small><code>'+m.tech(V)+'</code></div><div class="arw" aria-hidden="true">↓</div><div class="new"><small>LFAI 경영 보고</small><p>'+m.exec(V, L)+'</p><div class="ops" role="radiogroup" aria-label="조치안">';
    r += O.map(function(o){ return '<button type="button" role="radio" data-k="'+o.k+'" aria-checked="'+(sel === o.k)+'" class="'+(o.k === best ? "best" : "")+'"><span>'+o.n+'<small>'+(o.c ? won(o.c) : "")+(o.c && o.mo ? " · " : "")+(o.mo ? "월 "+won(o.mo) : "")+' · '+o.d+'</small></span><em>'+o.pt+'</em></button>'; }).join("");
    var none = !(B.y1 >= 0 || B.s*60 - B.c >= 0);
    if(none) r += '</div><p class="rec2">AI 권고 · 지금 규모(월 '+won(L)+')에서는 어느 안도 5년 안에 비용을 회수하지 못합니다. 투자를 보류하고 지표만 계속 봅니다.</p>'; else
    r += '</div><p class="rec2">AI 권고 · '+B.n+(B.c > 0 && B.s > 0 ? " — "+payT(B.pm)+" 안에 회수, " : B.s > 0 ? " — 매달 "+won(B.s)+" 절감, " : " — ")+(B.y1 >= 0 ? '1년 순효과 +'+won(B.y1) : '장기 투자 · 5년 순효과 '+(B.s*60-B.c >= 0 ? "+" : "−")+won(Math.abs(B.s*60-B.c)))+'</p>';
    var pick = sel ? O.filter(function(o){ return o.k === sel; })[0] : null;
    r += '<div class="go"><span>'+(pick ? "선택 · "+pick.n+(sel !== best ? " (권고와 다름 · 사유 기록)" : "") : "조치안을 고르세요")+'</span><button type="button" data-a="ok2"'+(pick ? "" : " disabled")+'>승인</button></div>';
    if(approved && approved.a === "ok") r += '<p class="log">✓ 승인 기록 '+approved.t+' · #'+approved.h+' · 계획 → 검증 → 승인 이력 저장</p>';
    $("appRep").innerHTML = r + '</div><figcaption>예시 · 계산식은 아래 공개</figcaption>';
    if(none) [].forEach.call($("appRep").querySelectorAll(".best"), function(b){ b.classList.remove("best"); });
    $("appNote").innerHTML = '계산식 · '+m.formula+'. AI 권고는 1년 순효과(월 절감 × 12 − 초기 비용)가 가장 큰 안이며, 회수에 1년 이상 걸리는 장기 투자는 5년 순효과로 표시합니다. 조치 비용과 감소율은 기본값이며, 진단 때 현장 견적과 실측으로 바꿉니다.';
    app._best = best;
  }
  function approve(a, key){
    var m = M[cur], L = m.loss(V), O = m.opts(V, L), o = O.filter(function(x){ return x.k === key; })[0];
    var t = new Date(), h = 0, src = cur+key+JSON.stringify(V)+t.getTime(); for(var i=0;i<src.length;i++) h = (h*31 + src.charCodeAt(i)) >>> 0;
    approved = {a:a, n:o.n, t:t.toTimeString().slice(0,8), h:h.toString(16).padStart(8,"0")}; sel = key; calc();
  }
  app.addEventListener("click", function(e){
    var b = e.target.closest("button"); if(!b || !app.contains(b)) return; touched = true;
    if(b.dataset.s){ cur = b.dataset.s; build(); return; }
    if(b.dataset.a === "ok") return approve("ok", app._best);
    if(b.dataset.a === "hold") return approve("hold", app._best);
    if(b.dataset.a === "ok2" && sel) return approve("ok", sel);
    if(b.dataset.k && b.getAttribute("role") === "radio"){ sel = b.dataset.k; approved = null; calc(); }
  });
  document.querySelectorAll("[data-go]").forEach(function(a){ a.addEventListener("click", function(){ cur = a.dataset.go; build(); }); });
  build();
  // 처음 보일 때 첫 입력값을 한 번 움직여 계산이 바뀌는 걸 보여 줌 (손대면 즉시 중단)
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window){
    var io = new IntersectionObserver(function(es){ if(!es[0].isIntersecting) return; io.disconnect();
      var k = M[cur].knobs[0], lo = k[5], hi = Math.min(k[3], k[5] + (k[3]-k[2])*.5), seq = [], i;
      for(i=1;i<=5;i++) seq.push(lo + (hi-lo)*i/5); for(i=4;i>=0;i--) seq.push(lo + (hi-lo)*i/5);
      var tm = setInterval(function(){ if(touched || !seq.length){ clearInterval(tm); return; }
        var val = Math.round(seq.shift()/k[4])*k[4]; V[k[0]] = val; var inp = $("appKnobs").querySelector("input"); if(inp) inp.value = val; calc(); }, 340);
    }, {threshold: .35});
    io.observe(app);
  }
})();

/* 아키텍처 도면 펼치기 */
(function(){
  var m = document.getElementById("mapprev"); if(!m) return;
  var b = m.querySelector(".mapmore");
  b.addEventListener("click", function(){ var o = m.classList.toggle("open"); b.setAttribute("aria-expanded", o); b.textContent = o ? "도면 접기" : "전체 도면 펼치기"; if(!o) m.scrollIntoView({block:"start"}); });
})();

/* 핵심 3가지 탭 */
(function(){
  var w = document.querySelector(".pwrap"); if(!w) return;
  var tabs = w.querySelectorAll(".ptabs button"), panes = w.querySelectorAll(".pp");
  [].forEach.call(tabs, function(t){ t.addEventListener("click", function(){
    [].forEach.call(tabs, function(x){ x.setAttribute("aria-selected", x === t ? "true" : "false"); });
    [].forEach.call(panes, function(p){ p.classList.toggle("on", p.dataset.p === t.dataset.p); });
  }); });
})();

/* 아키텍처 도식: 요소 설명 + 요청 처리 흐름 재생 */
(function(){
  var a = document.getElementById("arch"); if(!a) return;
  var cap = document.getElementById("archCap"), play = document.getElementById("archPlay"), timers = [];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clear = function(){ timers.forEach(clearTimeout); timers = []; [].forEach.call(a.querySelectorAll(".hot"), function(e){ e.classList.remove("hot"); }); a.classList.remove("run"); };
  var hot = function(ids){ [].forEach.call(a.querySelectorAll(".hot"), function(e){ e.classList.remove("hot"); }); ids.forEach(function(id){ var e = a.querySelector('[data-id="'+id+'"]'); if(e) e.classList.add("hot"); }); };
  a.addEventListener("click", function(e){
    var t = e.target.closest("[data-d]"); if(!t || t === play) return;
    clear(); play.innerHTML = "<i>▶</i> 요청 처리 흐름 보기"; t.classList.add("hot"); cap.innerHTML = "<b>"+(t.querySelector("h5,b") ? t.querySelector("h5,b").textContent : t.childNodes[0].textContent)+"</b> "+t.dataset.d;
  });
  var steps = [
    [["phone","svc-civil"], "① 담당자가 모바일(휴대폰·태블릿)로 말합니다. “지난달 반복 민원 정리하고 줄일 방법 보고해 줘.”"],
    [["mcp"], "② 요청은 표준 프로토콜(MCP)로 에이전트 공정에 전달됩니다."],
    [["a1","a2"], "③ 접수·분류 에이전트(A1)가 민원을 유형별로 나누고, 절차 작성 에이전트(A2)가 표준 절차(레시피)로 계획을 씁니다."],
    [["route","onto","data"], "④ 사내 SLM이 민원 기록을 표준 규격으로 읽고, 온톨로지에서 ‘주차 민원 – 담당 부서 – 처리 규정’ 관계를 찾습니다."],
    [["a3","a5"], "⑤ 사전 검증(A3)으로 권한·범위를 확인하고, 품질 관리(A5)가 재문의율 관리도 이탈을 잡아냅니다."],
    [["a6","svc-report"], "⑥ 원가·보고(A6)가 “반복 문의로 매달 480만 원, 자동 답변 초안이면 3.1개월 회수”로 경영 보고를 만듭니다."],
    [["phone","a4","a7"], "⑦ 담당자가 모바일에서 승인하면 실행·연동(A4)이 적용하고, 모든 단계가 이력(A7)으로 남습니다. ✓"]
  ];
  var run = function(){
    clear(); a.classList.add("run"); play.innerHTML = "<i>■</i> 재생 중";
    steps.forEach(function(s, i){ timers.push(setTimeout(function(){ hot(s[0]); cap.innerHTML = s[1]; }, i*(reduce ? 0 : 2100))); });
    timers.push(setTimeout(function(){ a.classList.remove("run"); play.innerHTML = "<i>▶</i> 다시 보기"; }, steps.length*(reduce ? 0 : 2100)));
  };
  play.addEventListener("click", run);
  if(!reduce && "IntersectionObserver" in window){
    var io = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ io.disconnect(); run(); } }, {threshold: .45});
    io.observe(a);
  }
})();

/* 운영 시나리오 에뮬레이터 — 8주 운영을 주 단위로 구동, 4주차 경영 보고에서 승인 요청 */
(function(){
  var cards = document.querySelectorAll(".emu"); if(!cards.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var won = function(v){ return Math.round(v).toLocaleString()+"만 원"; };
  var C = {
    pub: { t:"공공 민원 센터", prob:"같은 질문 재문의가 40%, 담당자 시간이 반복 응대에 묶임", mods:"민원 분류 에이전트 · 자동 답변 초안", fix:"자동 답변 초안", kpi:"1회 처리 완결률", base:60, after:84, loss:480, cut:.6, cost:900,
      ev:["민원 1,200건 수집 · 유형 자동 분류 시작","분류 기준 학습 · 담당 배정 자동화","⚠ 주차 민원 재문의율 관리도 이탈 감지","경영 보고 생성","자동 답변 초안 적용 · 담당자 검토 후 발송","재문의 감소 시작","FAQ 레시피 갱신 · 신규 유형 2개 추가","8주 결과 집계"] },
    con: { t:"영상 콘텐츠 제작 라인", prob:"반려·재작업 25%, 편집자 시간의 상당 부분이 다시 만들기에 소모", mods:"품질 게이트 · 제작 레시피", fix:"품질 게이트", kpi:"1차 통과율", base:75, after:90, loss:180, cut:.6, cost:300,
      ev:["주 10편 제작 · 반려 사유 수집","자막·음량·규격 검수 항목 정의","⚠ 자막 오류 반려 연속 4건 · 관리도 이탈","경영 보고 생성","품질 게이트 적용 · 발행 전 자동 검수","반려 감소 시작","레시피 고정 · 템플릿 3종 표준화","8주 결과 집계"] },
    res: { t:"연구실 인터뷰 분석", prob:"재코딩 30%, 코더마다 기준이 달라 연구 시간이 다시 분석에 쓰임", mods:"코딩북 표준화 · AI 1차 코딩 + 연구자 검수", fix:"AI 1차 코딩", kpi:"1차 코딩 통과율", base:70, after:94, loss:540, cut:.8, cost:1200,
      ev:["전사본 200건 수집 · 개인정보 비식별","코딩북 버전 고정 · 분석 이력 기록 시작","⚠ 코더 간 일치도 κ 0.74 · 기준 0.80 미달","경영 보고 생성","AI 1차 코딩 + 연구자 검수 적용","재코딩 감소 시작","불일치 사례로 코딩북 개정","8주 결과 집계"] }
  };
  function render(el){
    var c = C[el.dataset.case];
    el.innerHTML = '<div class="eb"><i></i><i></i><i></i><span>LFAI · 시나리오</span></div>'
      + '<h3>'+c.t+'</h3><dl><dt>문제</dt><dd>'+c.prob+'</dd><dt>투입</dt><dd>'+c.mods+'</dd><dt>기간</dt><dd>8주</dd></dl>'
      + '<div class="scr"><div class="kp"><span>'+c.kpi+'</span><b class="kv">'+c.base+'%</b><em class="wk">0주차</em></div>'
      + '<svg class="ch" viewBox="0 0 280 90" preserveAspectRatio="none" aria-hidden="true"><line class="tg" x1="0" y1="'+(90-(c.after-50)*1.6)+'" x2="280" y2="'+(90-(c.after-50)*1.6)+'"/><polyline class="ln" points=""/></svg>'
      + '<ol class="lg" aria-live="polite"></ol>'
      + '<div class="gate" hidden><p><small>LFAI 경영 보고</small>반복 업무로 <b>매달 '+won(c.loss)+'</b>이 새고 있습니다. '+c.fix+'('+won(c.cost)+')이면 <b>'+(c.cost/(c.loss*c.cut)).toFixed(1)+'개월</b>에 회수됩니다.</p><button type="button" class="ok">승인</button></div>'
      + '<div class="res" hidden></div></div>'
      + '<button type="button" class="runb">▶ 8주 운영 실행</button>';
  }
  function start(el){
    var c = C[el.dataset.case], wk = 0, pts = [], lg = el.querySelector(".lg"), ln = el.querySelector(".ln"), kv = el.querySelector(".kv"), wkE = el.querySelector(".wk"), gate = el.querySelector(".gate"), res = el.querySelector(".res"), btn = el.querySelector(".runb"), tm;
    lg.innerHTML = ""; res.hidden = true; gate.hidden = true; btn.disabled = true; btn.textContent = "운영 중…"; el.classList.add("running");
    var val = function(w){ return w <= 3 ? c.base - (w === 3 ? 4 : w) : w <= 4 ? c.base - 4 : c.base + (c.after - c.base) * Math.min(1, (w-4)/4); };
    var draw = function(){ ln.setAttribute("points", pts.map(function(v, i){ return (i*40).toFixed(0)+","+(90-(v-50)*1.6).toFixed(1); }).join(" ")); };
    var step = function(){
      wk++; var v = val(wk); pts.push(v); draw(); kv.textContent = Math.round(v)+"%"; wkE.textContent = wk+"주차";
      var li = document.createElement("li"); li.textContent = wk+"주 · "+c.ev[wk-1]; if(c.ev[wk-1].charAt(0) === "⚠") li.className = "warn"; lg.insertBefore(li, lg.firstChild);
      if(wk === 4){ gate.hidden = false; el.classList.add("wait"); btn.textContent = "승인 요청 중"; gate.querySelector(".ok").onclick = function(){ gate.hidden = true; el.classList.remove("wait"); btn.textContent = "운영 중…"; var l2 = document.createElement("li"); l2.className = "okk"; l2.textContent = "✓ 승인 · 이력 기록"; lg.insertBefore(l2, lg.firstChild); tm = setTimeout(step, reduce ? 0 : 650); }; return; }
      if(wk < 8){ tm = setTimeout(step, reduce ? 0 : 650); return; }
      var saved = c.loss*c.cut;
      res.hidden = false; res.innerHTML = '<div><span>'+c.kpi+'</span><b>'+c.base+'% → '+c.after+'%</b></div><div><span>월 손실</span><b>'+won(c.loss)+' → '+won(c.loss-saved)+'</b></div><div><span>투자 회수</span><b>'+(c.cost/saved).toFixed(1)+'개월</b></div>';
      btn.disabled = false; btn.textContent = "↻ 다시 실행"; el.classList.remove("running");
    };
    pts.push(c.base); draw(); step();
  }
  [].forEach.call(cards, function(el){ render(el); el.addEventListener("click", function(e){ var b = e.target.closest(".runb"); if(b && !b.disabled){ render(el); start(el); } }); });
  if(!reduce && "IntersectionObserver" in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ io.unobserve(en.target); start(en.target); } }); }, {threshold: .5});
    [].forEach.call(cards, function(el){ io.observe(el); });
  }
})();
