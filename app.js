/* CTG shared data layer — admin seenBy + soft-delete support */

function describeFirebaseError(err) {
  const code = (err && err.code) || "";
  if (code === "permission-denied" || code === "auth/insufficient-permission")
    return {title:"The database refused the request",body:"Firestore is connected, but its security rules are blocking this.",fix:"Firebase console → Firestore Database → Rules → publish your firestore.rules."};
  if (code === "unavailable" || code === "auth/network-request-failed")
    return {title:"Couldn't reach Firebase",body:"The browser couldn't connect to Firebase.",fix:"Check your connection, then reload the page."};
  if (code === "not-found" || code === "failed-precondition")
    return {title:"No Firestore database found",body:"The project exists, but Firestore is not available in Native mode.",fix:"Firebase console → Build → Firestore Database → Create database."};
  return {title:"Something went wrong talking to Firebase",body:(err && err.message) ? err.message : String(err),fix:"Open Inspect → Console for the full error."};
}
function showTrouble(elId, err) {
  const el=document.getElementById(elId);
  console.error("[CTG]",err);
  if(!el)return;
  const d=describeFirebaseError(err);
  el.innerHTML="<strong>"+escapeHtml(d.title)+"</strong>"+escapeHtml(d.body)+"<p class='fix'>"+escapeHtml(d.fix)+(err&&err.code?" <code>"+escapeHtml(err.code)+"</code>":"")+"</p>";
  el.classList.add("show");
}
function hideTrouble(elId){const el=document.getElementById(elId);if(el)el.classList.remove("show");}

const CONFIG_OK=(typeof db!=="undefined"&&typeof auth!=="undefined");

function detectLang(text){return /[\uAC00-\uD7A3]/.test(text||"")?"ko":"en";}
async function translateText(text,sourceLang,targetLang){
  const clean=(text||"").trim();
  if(!clean)return "";
  if(sourceLang===targetLang)return clean;
  const url="https://api.mymemory.translated.net/get?q="+encodeURIComponent(clean)+"&langpair="+sourceLang+"|"+targetLang;
  const res=await fetch(url);
  if(!res.ok)throw new Error("Translation service unavailable ("+res.status+")");
  const data=await res.json();
  const out=data&&data.responseData&&data.responseData.translatedText;
  if(!out)throw new Error("Translation service returned no result");
  return out;
}
async function draftBilingual(text){
  const sourceLang=detectLang(text),targetLang=sourceLang==="en"?"ko":"en";
  const translated=await translateText(text,sourceLang,targetLang);
  return sourceLang==="en"?{en:text.trim(),ko:translated,sourceLang}:{en:translated,ko:text.trim(),sourceLang};
}

const PrayerBoard={
  addSubmission({type,name,message}){
    return db.collection("submissions").add({
      type,name:(name||"").trim(),message:(message||"").trim(),
      date:firebase.firestore.FieldValue.serverTimestamp(),
      seen:false,seenBy:[]
    });
  },
  onSubmissions(callback,onError){
    return db.collection("submissions").orderBy("date","desc").onSnapshot(
      snap=>callback(snap.docs.map(d=>({id:d.id,...d.data()}))),
      err=>onError&&onError(err)
    );
  },
  markManySeen(collection,items,uid){
    if(!uid||!items.length)return Promise.resolve();
    const batch=db.batch();
    items.forEach(item=>batch.update(db.collection(collection).doc(item.id),{
      seenBy:firebase.firestore.FieldValue.arrayUnion(uid)
    }));
    return batch.commit();
  },
  softDelete(collection,id,uid){
    return db.collection(collection).doc(id).update({
      deleted:true,
      deletedAt:firebase.firestore.FieldValue.serverTimestamp(),
      deletedBy:uid||null
    });
  },
  restore(collection,id){
    return db.collection(collection).doc(id).update({
      deleted:false,deletedAt:null,deletedBy:null
    });
  },
  permanentlyDelete(collection,id){
    return db.collection(collection).doc(id).delete();
  },
  purgeExpiredDeleted(collection,items){
    const cutoff=Date.now()-14*24*60*60*1000;
    const expired=items.filter(x=>x.deletedAt&&x.deletedAt.toDate&&x.deletedAt.toDate().getTime()<cutoff);
    if(!expired.length)return Promise.resolve(0);
    const batch=db.batch();
    expired.forEach(x=>batch.delete(db.collection(collection).doc(x.id)));
    return batch.commit().then(()=>expired.length);
  },
  async publishSubmissionToBoard(id,{question_en,question_ko,answer_en,answer_ko}){
    const doc=await db.collection("submissions").doc(id).get();
    if(!doc.exists)return;
    const item=doc.data();
    if(item.type!=="ask")throw new Error("Only questions can be posted to the board.");
    await db.collection("board").add({
      question_en:(question_en||"").trim(),question_ko:(question_ko||"").trim(),
      answer_en:(answer_en||"").trim(),answer_ko:(answer_ko||"").trim(),
      date:firebase.firestore.FieldValue.serverTimestamp(),seenBy:[]
    });
    await db.collection("submissions").doc(id).delete();
  },
  onBoard(callback,onError){
    return db.collection("board").orderBy("date","desc").onSnapshot(
      snap=>callback(snap.docs.map(d=>({id:d.id,...normalizeBoardEntry(d.data())}))),
      err=>onError&&onError(err)
    );
  },
  addBoardEntry({question_en,question_ko,answer_en,answer_ko}){
    return db.collection("board").add({
      question_en:(question_en||"").trim(),question_ko:(question_ko||"").trim(),
      answer_en:(answer_en||"").trim(),answer_ko:(answer_ko||"").trim(),
      date:firebase.firestore.FieldValue.serverTimestamp(),seenBy:[]
    });
  },
  updateBoardEntry(id,data){
    const clean={};
    ["question_en","question_ko","answer_en","answer_ko"].forEach(k=>{
      if(data[k]!==undefined)clean[k]=(data[k]||"").trim();
    });
    return db.collection("board").doc(id).update(clean);
  },
  signIn(email,password){return auth.signInWithEmailAndPassword(email,password);},
  signOut(){return auth.signOut();},
  onAuthChange(callback){return auth.onAuthStateChanged(callback);},
  currentUid(){return auth.currentUser?auth.currentUser.uid:null;}
};

function normalizeBoardEntry(data){
  if(data.question_en!==undefined||data.question_ko!==undefined)return data;
  return {...data,question_en:data.question||"",question_ko:data.question||"",answer_en:data.answer||"",answer_ko:data.answer||""};
}
function formatDate(ts){
  if(!ts)return "Just now";
  const d=ts.toDate?ts.toDate():new Date(ts);
  return d.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
}
function escapeHtml(str){
  const div=document.createElement("div");
  div.textContent=(str===undefined||str===null)?"":String(str);
  return div.innerHTML;
}
function isWithinDays(ts,days){
  if(!ts||!ts.toDate)return false;
  const ms=Date.now()-ts.toDate().getTime();
  return ms>=0&&ms<days*24*60*60*1000;
}
