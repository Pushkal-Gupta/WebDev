import{r as Ns,j as Ee}from"./index-BK-vsMuS.js";import{s as ql}from"./scoreBus-CE6JRkNH.js";/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ha="184",Yl=0,Xa=1,jl=2,ms=1,Kl=2,Pi=3,In=0,It=1,_n=2,xn=0,fi=1,qa=2,Ya=3,ja=4,Zl=5,Vn=100,$l=101,Jl=102,Ql=103,ec=104,tc=200,nc=201,ic=202,sc=203,xr=204,vr=205,rc=206,ac=207,oc=208,lc=209,cc=210,uc=211,hc=212,dc=213,fc=214,Mr=0,Sr=1,Er=2,mi=3,yr=4,Tr=5,br=6,Ar=7,nl=0,pc=1,mc=2,an=0,il=1,sl=2,rl=3,al=4,ol=5,ll=6,cl=7,ul=300,qn=301,_i=302,Fs=303,Os=304,Cs=306,wr=1e3,gn=1001,Rr=1002,Et=1003,_c=1004,Vi=1005,Rt=1006,Bs=1007,kn=1008,zt=1009,hl=1010,dl=1011,Ii=1012,da=1013,ln=1014,sn=1015,Mn=1016,fa=1017,pa=1018,Ui=1020,fl=35902,pl=35899,ml=1021,_l=1022,Kt=1023,Sn=1026,Wn=1027,gl=1028,ma=1029,Yn=1030,_a=1031,ga=1033,_s=33776,gs=33777,xs=33778,vs=33779,Cr=35840,Pr=35841,Lr=35842,Dr=35843,Ir=36196,Ur=37492,Nr=37496,Fr=37488,Or=37489,Ss=37490,Br=37491,zr=37808,Gr=37809,Vr=37810,Hr=37811,kr=37812,Wr=37813,Xr=37814,qr=37815,Yr=37816,jr=37817,Kr=37818,Zr=37819,$r=37820,Jr=37821,Qr=36492,ea=36494,ta=36495,na=36283,ia=36284,Es=36285,sa=36286,gc=3200,ra=0,xc=1,Ln="",Ht="srgb",ys="srgb-linear",Ts="linear",$e="srgb",$n=7680,Ka=519,vc=512,Mc=513,Sc=514,xa=515,Ec=516,yc=517,va=518,Tc=519,Za=35044,$a="300 es",rn=2e3,Ni=2001;function bc(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function bs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Ac(){const i=bs("canvas");return i.style.display="block",i}const Ja={};function Qa(...i){const e="THREE."+i.shift();console.log(e,...i)}function xl(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Pe(...i){i=xl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Xe(...i){i=xl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function aa(...i){const e=i.join(" ");e in Ja||(Ja[e]=!0,Pe(...i))}function wc(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}const Rc={[Mr]:Sr,[Er]:br,[yr]:Ar,[mi]:Tr,[Sr]:Mr,[br]:Er,[Ar]:yr,[Tr]:mi};class jn{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const s=n[e];if(s!==void 0){const r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}}const At=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],zs=Math.PI/180,oa=180/Math.PI;function Fi(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(At[i&255]+At[i>>8&255]+At[i>>16&255]+At[i>>24&255]+"-"+At[e&255]+At[e>>8&255]+"-"+At[e>>16&15|64]+At[e>>24&255]+"-"+At[t&63|128]+At[t>>8&255]+"-"+At[t>>16&255]+At[t>>24&255]+At[n&255]+At[n>>8&255]+At[n>>16&255]+At[n>>24&255]).toLowerCase()}function ke(i,e,t){return Math.max(e,Math.min(t,i))}function Cc(i,e){return(i%e+e)%e}function Gs(i,e,t){return(1-t)*i+t*e}function Ei(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Dt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Da=class Da{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Da.prototype.isVector2=!0;let qe=Da;class vi{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let u=n[s+0],h=n[s+1],p=n[s+2],m=n[s+3],d=r[a+0],_=r[a+1],v=r[a+2],S=r[a+3];if(m!==S||u!==d||h!==_||p!==v){let f=u*d+h*_+p*v+m*S;f<0&&(d=-d,_=-_,v=-v,S=-S,f=-f);let l=1-o;if(f<.9995){const x=Math.acos(f),y=Math.sin(x);l=Math.sin(l*x)/y,o=Math.sin(o*x)/y,u=u*l+d*o,h=h*l+_*o,p=p*l+v*o,m=m*l+S*o}else{u=u*l+d*o,h=h*l+_*o,p=p*l+v*o,m=m*l+S*o;const x=1/Math.sqrt(u*u+h*h+p*p+m*m);u*=x,h*=x,p*=x,m*=x}}e[t]=u,e[t+1]=h,e[t+2]=p,e[t+3]=m}static multiplyQuaternionsFlat(e,t,n,s,r,a){const o=n[s],u=n[s+1],h=n[s+2],p=n[s+3],m=r[a],d=r[a+1],_=r[a+2],v=r[a+3];return e[t]=o*v+p*m+u*_-h*d,e[t+1]=u*v+p*d+h*m-o*_,e[t+2]=h*v+p*_+o*d-u*m,e[t+3]=p*v-o*m-u*d-h*_,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,u=Math.sin,h=o(n/2),p=o(s/2),m=o(r/2),d=u(n/2),_=u(s/2),v=u(r/2);switch(a){case"XYZ":this._x=d*p*m+h*_*v,this._y=h*_*m-d*p*v,this._z=h*p*v+d*_*m,this._w=h*p*m-d*_*v;break;case"YXZ":this._x=d*p*m+h*_*v,this._y=h*_*m-d*p*v,this._z=h*p*v-d*_*m,this._w=h*p*m+d*_*v;break;case"ZXY":this._x=d*p*m-h*_*v,this._y=h*_*m+d*p*v,this._z=h*p*v+d*_*m,this._w=h*p*m-d*_*v;break;case"ZYX":this._x=d*p*m-h*_*v,this._y=h*_*m+d*p*v,this._z=h*p*v-d*_*m,this._w=h*p*m+d*_*v;break;case"YZX":this._x=d*p*m+h*_*v,this._y=h*_*m+d*p*v,this._z=h*p*v-d*_*m,this._w=h*p*m-d*_*v;break;case"XZY":this._x=d*p*m-h*_*v,this._y=h*_*m-d*p*v,this._z=h*p*v+d*_*m,this._w=h*p*m+d*_*v;break;default:Pe("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],u=t[9],h=t[2],p=t[6],m=t[10],d=n+o+m;if(d>0){const _=.5/Math.sqrt(d+1);this._w=.25/_,this._x=(p-u)*_,this._y=(r-h)*_,this._z=(a-s)*_}else if(n>o&&n>m){const _=2*Math.sqrt(1+n-o-m);this._w=(p-u)/_,this._x=.25*_,this._y=(s+a)/_,this._z=(r+h)/_}else if(o>m){const _=2*Math.sqrt(1+o-n-m);this._w=(r-h)/_,this._x=(s+a)/_,this._y=.25*_,this._z=(u+p)/_}else{const _=2*Math.sqrt(1+m-n-o);this._w=(a-s)/_,this._x=(r+h)/_,this._y=(u+p)/_,this._z=.25*_}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ke(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,u=t._y,h=t._z,p=t._w;return this._x=n*p+a*o+s*h-r*u,this._y=s*p+a*u+r*o-n*h,this._z=r*p+a*h+n*u-s*o,this._w=a*p-n*o-s*u-r*h,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let u=1-t;if(o<.9995){const h=Math.acos(o),p=Math.sin(h);u=Math.sin(u*h)/p,t=Math.sin(t*h)/p,this._x=this._x*u+n*t,this._y=this._y*u+s*t,this._z=this._z*u+r*t,this._w=this._w*u+a*t,this._onChangeCallback()}else this._x=this._x*u+n*t,this._y=this._y*u+s*t,this._z=this._z*u+r*t,this._w=this._w*u+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Ia=class Ia{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(eo.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(eo.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,u=e.w,h=2*(a*s-o*n),p=2*(o*t-r*s),m=2*(r*n-a*t);return this.x=t+u*h+a*m-o*p,this.y=n+u*p+o*h-r*m,this.z=s+u*m+r*p-a*h,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this.z=ke(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this.z=ke(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,u=t.z;return this.x=s*u-r*o,this.y=r*a-n*u,this.z=n*o-s*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Vs.copy(this).projectOnVector(e),this.sub(Vs)}reflect(e){return this.sub(Vs.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Ia.prototype.isVector3=!0;let U=Ia;const Vs=new U,eo=new vi,Ua=class Ua{constructor(e,t,n,s,r,a,o,u,h){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,u,h)}set(e,t,n,s,r,a,o,u,h){const p=this.elements;return p[0]=e,p[1]=s,p[2]=o,p[3]=t,p[4]=r,p[5]=u,p[6]=n,p[7]=a,p[8]=h,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],u=n[6],h=n[1],p=n[4],m=n[7],d=n[2],_=n[5],v=n[8],S=s[0],f=s[3],l=s[6],x=s[1],y=s[4],T=s[7],P=s[2],b=s[5],I=s[8];return r[0]=a*S+o*x+u*P,r[3]=a*f+o*y+u*b,r[6]=a*l+o*T+u*I,r[1]=h*S+p*x+m*P,r[4]=h*f+p*y+m*b,r[7]=h*l+p*T+m*I,r[2]=d*S+_*x+v*P,r[5]=d*f+_*y+v*b,r[8]=d*l+_*T+v*I,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],u=e[6],h=e[7],p=e[8];return t*a*p-t*o*h-n*r*p+n*o*u+s*r*h-s*a*u}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],u=e[6],h=e[7],p=e[8],m=p*a-o*h,d=o*u-p*r,_=h*r-a*u,v=t*m+n*d+s*_;if(v===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/v;return e[0]=m*S,e[1]=(s*h-p*n)*S,e[2]=(o*n-s*a)*S,e[3]=d*S,e[4]=(p*t-s*u)*S,e[5]=(s*r-o*t)*S,e[6]=_*S,e[7]=(n*u-h*t)*S,e[8]=(a*t-n*r)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){const u=Math.cos(r),h=Math.sin(r);return this.set(n*u,n*h,-n*(u*a+h*o)+a+e,-s*h,s*u,-s*(-h*a+u*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Hs.makeScale(e,t)),this}rotate(e){return this.premultiply(Hs.makeRotation(-e)),this}translate(e,t){return this.premultiply(Hs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Ua.prototype.isMatrix3=!0;let Ie=Ua;const Hs=new Ie,to=new Ie().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),no=new Ie().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Pc(){const i={enabled:!0,workingColorSpace:ys,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===$e&&(s.r=vn(s.r),s.g=vn(s.g),s.b=vn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===$e&&(s.r=pi(s.r),s.g=pi(s.g),s.b=pi(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Ln?Ts:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return aa("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return aa("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[ys]:{primaries:e,whitePoint:n,transfer:Ts,toXYZ:to,fromXYZ:no,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ht},outputColorSpaceConfig:{drawingBufferColorSpace:Ht}},[Ht]:{primaries:e,whitePoint:n,transfer:$e,toXYZ:to,fromXYZ:no,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ht}}}),i}const He=Pc();function vn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function pi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Jn;class Lc{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Jn===void 0&&(Jn=bs("canvas")),Jn.width=e.width,Jn.height=e.height;const s=Jn.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=Jn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=bs("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=vn(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(vn(t[n]/255)*255):t[n]=vn(t[n]);return{data:t,width:e.width,height:e.height}}else return Pe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Dc=0;class Ma{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Dc++}),this.uuid=Fi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(ks(s[a].image)):r.push(ks(s[a]))}else r=ks(s);n.url=r}return t||(e.images[this.uuid]=n),n}}function ks(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Lc.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Pe("Texture: Unable to serialize Texture."),{})}let Ic=0;const Ws=new U;class Lt extends jn{constructor(e=Lt.DEFAULT_IMAGE,t=Lt.DEFAULT_MAPPING,n=gn,s=gn,r=Rt,a=kn,o=Kt,u=zt,h=Lt.DEFAULT_ANISOTROPY,p=Ln){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ic++}),this.uuid=Fi(),this.name="",this.source=new Ma(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=h,this.format=o,this.internalFormat=null,this.type=u,this.offset=new qe(0,0),this.repeat=new qe(1,1),this.center=new qe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ie,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=p,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Ws).x}get height(){return this.source.getSize(Ws).y}get depth(){return this.source.getSize(Ws).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Pe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Pe(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ul)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case wr:e.x=e.x-Math.floor(e.x);break;case gn:e.x=e.x<0?0:1;break;case Rr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case wr:e.y=e.y-Math.floor(e.y);break;case gn:e.y=e.y<0?0:1;break;case Rr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Lt.DEFAULT_IMAGE=null;Lt.DEFAULT_MAPPING=ul;Lt.DEFAULT_ANISOTROPY=1;const Na=class Na{constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r;const u=e.elements,h=u[0],p=u[4],m=u[8],d=u[1],_=u[5],v=u[9],S=u[2],f=u[6],l=u[10];if(Math.abs(p-d)<.01&&Math.abs(m-S)<.01&&Math.abs(v-f)<.01){if(Math.abs(p+d)<.1&&Math.abs(m+S)<.1&&Math.abs(v+f)<.1&&Math.abs(h+_+l-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const y=(h+1)/2,T=(_+1)/2,P=(l+1)/2,b=(p+d)/4,I=(m+S)/4,g=(v+f)/4;return y>T&&y>P?y<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(y),s=b/n,r=I/n):T>P?T<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(T),n=b/s,r=g/s):P<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(P),n=I/r,s=g/r),this.set(n,s,r,t),this}let x=Math.sqrt((f-v)*(f-v)+(m-S)*(m-S)+(d-p)*(d-p));return Math.abs(x)<.001&&(x=1),this.x=(f-v)/x,this.y=(m-S)/x,this.z=(d-p)/x,this.w=Math.acos((h+_+l-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=ke(this.x,e.x,t.x),this.y=ke(this.y,e.y,t.y),this.z=ke(this.z,e.z,t.z),this.w=ke(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=ke(this.x,e,t),this.y=ke(this.y,e,t),this.z=ke(this.z,e,t),this.w=ke(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Na.prototype.isVector4=!0;let dt=Na;class Uc extends jn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Rt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new dt(0,0,e,t),this.scissorTest=!1,this.viewport=new dt(0,0,e,t),this.textures=[];const s={width:e,height:t,depth:n.depth},r=new Lt(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){const t={minFilter:Rt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ma(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this.multiview=e.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}}class on extends Uc{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class vl extends Lt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Et,this.minFilter=Et,this.wrapR=gn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Nc extends Lt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Et,this.minFilter=Et,this.wrapR=gn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Rs=class Rs{constructor(e,t,n,s,r,a,o,u,h,p,m,d,_,v,S,f){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,u,h,p,m,d,_,v,S,f)}set(e,t,n,s,r,a,o,u,h,p,m,d,_,v,S,f){const l=this.elements;return l[0]=e,l[4]=t,l[8]=n,l[12]=s,l[1]=r,l[5]=a,l[9]=o,l[13]=u,l[2]=h,l[6]=p,l[10]=m,l[14]=d,l[3]=_,l[7]=v,l[11]=S,l[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Rs().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();const t=this.elements,n=e.elements,s=1/Qn.setFromMatrixColumn(e,0).length(),r=1/Qn.setFromMatrixColumn(e,1).length(),a=1/Qn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),u=Math.cos(s),h=Math.sin(s),p=Math.cos(r),m=Math.sin(r);if(e.order==="XYZ"){const d=a*p,_=a*m,v=o*p,S=o*m;t[0]=u*p,t[4]=-u*m,t[8]=h,t[1]=_+v*h,t[5]=d-S*h,t[9]=-o*u,t[2]=S-d*h,t[6]=v+_*h,t[10]=a*u}else if(e.order==="YXZ"){const d=u*p,_=u*m,v=h*p,S=h*m;t[0]=d+S*o,t[4]=v*o-_,t[8]=a*h,t[1]=a*m,t[5]=a*p,t[9]=-o,t[2]=_*o-v,t[6]=S+d*o,t[10]=a*u}else if(e.order==="ZXY"){const d=u*p,_=u*m,v=h*p,S=h*m;t[0]=d-S*o,t[4]=-a*m,t[8]=v+_*o,t[1]=_+v*o,t[5]=a*p,t[9]=S-d*o,t[2]=-a*h,t[6]=o,t[10]=a*u}else if(e.order==="ZYX"){const d=a*p,_=a*m,v=o*p,S=o*m;t[0]=u*p,t[4]=v*h-_,t[8]=d*h+S,t[1]=u*m,t[5]=S*h+d,t[9]=_*h-v,t[2]=-h,t[6]=o*u,t[10]=a*u}else if(e.order==="YZX"){const d=a*u,_=a*h,v=o*u,S=o*h;t[0]=u*p,t[4]=S-d*m,t[8]=v*m+_,t[1]=m,t[5]=a*p,t[9]=-o*p,t[2]=-h*p,t[6]=_*m+v,t[10]=d-S*m}else if(e.order==="XZY"){const d=a*u,_=a*h,v=o*u,S=o*h;t[0]=u*p,t[4]=-m,t[8]=h*p,t[1]=d*m+S,t[5]=a*p,t[9]=_*m-v,t[2]=v*m-_,t[6]=o*p,t[10]=S*m+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Fc,e,Oc)}lookAt(e,t,n){const s=this.elements;return Nt.subVectors(e,t),Nt.lengthSq()===0&&(Nt.z=1),Nt.normalize(),bn.crossVectors(n,Nt),bn.lengthSq()===0&&(Math.abs(n.z)===1?Nt.x+=1e-4:Nt.z+=1e-4,Nt.normalize(),bn.crossVectors(n,Nt)),bn.normalize(),Hi.crossVectors(Nt,bn),s[0]=bn.x,s[4]=Hi.x,s[8]=Nt.x,s[1]=bn.y,s[5]=Hi.y,s[9]=Nt.y,s[2]=bn.z,s[6]=Hi.z,s[10]=Nt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],u=n[8],h=n[12],p=n[1],m=n[5],d=n[9],_=n[13],v=n[2],S=n[6],f=n[10],l=n[14],x=n[3],y=n[7],T=n[11],P=n[15],b=s[0],I=s[4],g=s[8],A=s[12],L=s[1],C=s[5],G=s[9],Z=s[13],$=s[2],B=s[6],V=s[10],j=s[14],ne=s[3],ie=s[7],le=s[11],ve=s[15];return r[0]=a*b+o*L+u*$+h*ne,r[4]=a*I+o*C+u*B+h*ie,r[8]=a*g+o*G+u*V+h*le,r[12]=a*A+o*Z+u*j+h*ve,r[1]=p*b+m*L+d*$+_*ne,r[5]=p*I+m*C+d*B+_*ie,r[9]=p*g+m*G+d*V+_*le,r[13]=p*A+m*Z+d*j+_*ve,r[2]=v*b+S*L+f*$+l*ne,r[6]=v*I+S*C+f*B+l*ie,r[10]=v*g+S*G+f*V+l*le,r[14]=v*A+S*Z+f*j+l*ve,r[3]=x*b+y*L+T*$+P*ne,r[7]=x*I+y*C+T*B+P*ie,r[11]=x*g+y*G+T*V+P*le,r[15]=x*A+y*Z+T*j+P*ve,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],u=e[9],h=e[13],p=e[2],m=e[6],d=e[10],_=e[14],v=e[3],S=e[7],f=e[11],l=e[15],x=u*_-h*d,y=o*_-h*m,T=o*d-u*m,P=a*_-h*p,b=a*d-u*p,I=a*m-o*p;return t*(S*x-f*y+l*T)-n*(v*x-f*P+l*b)+s*(v*y-S*P+l*I)-r*(v*T-S*b+f*I)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],u=e[6],h=e[7],p=e[8],m=e[9],d=e[10],_=e[11],v=e[12],S=e[13],f=e[14],l=e[15],x=t*o-n*a,y=t*u-s*a,T=t*h-r*a,P=n*u-s*o,b=n*h-r*o,I=s*h-r*u,g=p*S-m*v,A=p*f-d*v,L=p*l-_*v,C=m*f-d*S,G=m*l-_*S,Z=d*l-_*f,$=x*Z-y*G+T*C+P*L-b*A+I*g;if($===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/$;return e[0]=(o*Z-u*G+h*C)*B,e[1]=(s*G-n*Z-r*C)*B,e[2]=(S*I-f*b+l*P)*B,e[3]=(d*b-m*I-_*P)*B,e[4]=(u*L-a*Z-h*A)*B,e[5]=(t*Z-s*L+r*A)*B,e[6]=(f*T-v*I-l*y)*B,e[7]=(p*I-d*T+_*y)*B,e[8]=(a*G-o*L+h*g)*B,e[9]=(n*L-t*G-r*g)*B,e[10]=(v*b-S*T+l*x)*B,e[11]=(m*T-p*b-_*x)*B,e[12]=(o*A-a*C-u*g)*B,e[13]=(t*C-n*A+s*g)*B,e[14]=(S*y-v*P-f*x)*B,e[15]=(p*P-m*y+d*x)*B,this}scale(e){const t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,u=e.z,h=r*a,p=r*o;return this.set(h*a+n,h*o-s*u,h*u+s*o,0,h*o+s*u,p*o+n,p*u-s*a,0,h*u-s*o,p*u+s*a,r*u*u+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,r=t._x,a=t._y,o=t._z,u=t._w,h=r+r,p=a+a,m=o+o,d=r*h,_=r*p,v=r*m,S=a*p,f=a*m,l=o*m,x=u*h,y=u*p,T=u*m,P=n.x,b=n.y,I=n.z;return s[0]=(1-(S+l))*P,s[1]=(_+T)*P,s[2]=(v-y)*P,s[3]=0,s[4]=(_-T)*b,s[5]=(1-(d+l))*b,s[6]=(f+x)*b,s[7]=0,s[8]=(v+y)*I,s[9]=(f-x)*I,s[10]=(1-(d+S))*I,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];const r=this.determinant();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Qn.set(s[0],s[1],s[2]).length();const o=Qn.set(s[4],s[5],s[6]).length(),u=Qn.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Xt.copy(this);const h=1/a,p=1/o,m=1/u;return Xt.elements[0]*=h,Xt.elements[1]*=h,Xt.elements[2]*=h,Xt.elements[4]*=p,Xt.elements[5]*=p,Xt.elements[6]*=p,Xt.elements[8]*=m,Xt.elements[9]*=m,Xt.elements[10]*=m,t.setFromRotationMatrix(Xt),n.x=a,n.y=o,n.z=u,this}makePerspective(e,t,n,s,r,a,o=rn,u=!1){const h=this.elements,p=2*r/(t-e),m=2*r/(n-s),d=(t+e)/(t-e),_=(n+s)/(n-s);let v,S;if(u)v=r/(a-r),S=a*r/(a-r);else if(o===rn)v=-(a+r)/(a-r),S=-2*a*r/(a-r);else if(o===Ni)v=-a/(a-r),S=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return h[0]=p,h[4]=0,h[8]=d,h[12]=0,h[1]=0,h[5]=m,h[9]=_,h[13]=0,h[2]=0,h[6]=0,h[10]=v,h[14]=S,h[3]=0,h[7]=0,h[11]=-1,h[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=rn,u=!1){const h=this.elements,p=2/(t-e),m=2/(n-s),d=-(t+e)/(t-e),_=-(n+s)/(n-s);let v,S;if(u)v=1/(a-r),S=a/(a-r);else if(o===rn)v=-2/(a-r),S=-(a+r)/(a-r);else if(o===Ni)v=-1/(a-r),S=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return h[0]=p,h[4]=0,h[8]=0,h[12]=d,h[1]=0,h[5]=m,h[9]=0,h[13]=_,h[2]=0,h[6]=0,h[10]=v,h[14]=S,h[3]=0,h[7]=0,h[11]=0,h[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Rs.prototype.isMatrix4=!0;let ut=Rs;const Qn=new U,Xt=new ut,Fc=new U(0,0,0),Oc=new U(1,1,1),bn=new U,Hi=new U,Nt=new U,io=new ut,so=new vi;class Un{constructor(e=0,t=0,n=0,s=Un.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,r=s[0],a=s[4],o=s[8],u=s[1],h=s[5],p=s[9],m=s[2],d=s[6],_=s[10];switch(t){case"XYZ":this._y=Math.asin(ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-p,_),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,h),this._z=0);break;case"YXZ":this._x=Math.asin(-ke(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(o,_),this._z=Math.atan2(u,h)):(this._y=Math.atan2(-m,r),this._z=0);break;case"ZXY":this._x=Math.asin(ke(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-m,_),this._z=Math.atan2(-a,h)):(this._y=0,this._z=Math.atan2(u,r));break;case"ZYX":this._y=Math.asin(-ke(m,-1,1)),Math.abs(m)<.9999999?(this._x=Math.atan2(d,_),this._z=Math.atan2(u,r)):(this._x=0,this._z=Math.atan2(-a,h));break;case"YZX":this._z=Math.asin(ke(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(-p,h),this._y=Math.atan2(-m,r)):(this._x=0,this._y=Math.atan2(o,_));break;case"XZY":this._z=Math.asin(-ke(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,h),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-p,_),this._y=0);break;default:Pe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return io.makeRotationFromQuaternion(e),this.setFromRotationMatrix(io,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return so.setFromEuler(this),this.setFromQuaternion(so,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Un.DEFAULT_ORDER="XYZ";class Sa{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Bc=0;const ro=new U,ei=new vi,hn=new ut,ki=new U,yi=new U,zc=new U,Gc=new vi,ao=new U(1,0,0),oo=new U(0,1,0),lo=new U(0,0,1),co={type:"added"},Vc={type:"removed"},ti={type:"childadded",child:null},Xs={type:"childremoved",child:null};class yt extends jn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Bc++}),this.uuid=Fi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=yt.DEFAULT_UP.clone();const e=new U,t=new Un,n=new vi,s=new U(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ut},normalMatrix:{value:new Ie}}),this.matrix=new ut,this.matrixWorld=new ut,this.matrixAutoUpdate=yt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=yt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Sa,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ei.setFromAxisAngle(e,t),this.quaternion.multiply(ei),this}rotateOnWorldAxis(e,t){return ei.setFromAxisAngle(e,t),this.quaternion.premultiply(ei),this}rotateX(e){return this.rotateOnAxis(ao,e)}rotateY(e){return this.rotateOnAxis(oo,e)}rotateZ(e){return this.rotateOnAxis(lo,e)}translateOnAxis(e,t){return ro.copy(e).applyQuaternion(this.quaternion),this.position.add(ro.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ao,e)}translateY(e){return this.translateOnAxis(oo,e)}translateZ(e){return this.translateOnAxis(lo,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(hn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ki.copy(e):ki.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),yi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?hn.lookAt(yi,ki,this.up):hn.lookAt(ki,yi,this.up),this.quaternion.setFromRotationMatrix(hn),s&&(hn.extractRotation(s.matrixWorld),ei.setFromRotationMatrix(hn),this.quaternion.premultiply(ei.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Xe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(co),ti.child=e,this.dispatchEvent(ti),ti.child=null):Xe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Vc),Xs.child=e,this.dispatchEvent(Xs),Xs.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),hn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),hn.multiply(e.parent.matrixWorld)),e.applyMatrix4(hn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(co),ti.child=e,this.dispatchEvent(ti),ti.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yi,e,zc),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yi,Gc,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,u){return o[u.uuid]===void 0&&(o[u.uuid]=u.toJSON(e)),u.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const u=o.shapes;if(Array.isArray(u))for(let h=0,p=u.length;h<p;h++){const m=u[h];r(e.shapes,m)}else r(e.shapes,u)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let u=0,h=this.material.length;u<h;u++)o.push(r(e.materials,this.material[u]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const u=this.animations[o];s.animations.push(r(e.animations,u))}}if(t){const o=a(e.geometries),u=a(e.materials),h=a(e.textures),p=a(e.images),m=a(e.shapes),d=a(e.skeletons),_=a(e.animations),v=a(e.nodes);o.length>0&&(n.geometries=o),u.length>0&&(n.materials=u),h.length>0&&(n.textures=h),p.length>0&&(n.images=p),m.length>0&&(n.shapes=m),d.length>0&&(n.skeletons=d),_.length>0&&(n.animations=_),v.length>0&&(n.nodes=v)}return n.object=s,n;function a(o){const u=[];for(const h in o){const p=o[h];delete p.metadata,u.push(p)}return u}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}}yt.DEFAULT_UP=new U(0,1,0);yt.DEFAULT_MATRIX_AUTO_UPDATE=!0;yt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Xn extends yt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Hc={type:"move"};class qs{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Xn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Xn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Xn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null;const o=this._targetRay,u=this._grip,h=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(h&&e.hand){a=!0;for(const S of e.hand.values()){const f=t.getJointPose(S,n),l=this._getHandJoint(h,S);f!==null&&(l.matrix.fromArray(f.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,l.jointRadius=f.radius),l.visible=f!==null}const p=h.joints["index-finger-tip"],m=h.joints["thumb-tip"],d=p.position.distanceTo(m.position),_=.02,v=.005;h.inputState.pinching&&d>_+v?(h.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!h.inputState.pinching&&d<=_-v&&(h.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else u!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(u.matrix.fromArray(r.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,r.linearVelocity?(u.hasLinearVelocity=!0,u.linearVelocity.copy(r.linearVelocity)):u.hasLinearVelocity=!1,r.angularVelocity?(u.hasAngularVelocity=!0,u.angularVelocity.copy(r.angularVelocity)):u.hasAngularVelocity=!1,u.eventsEnabled&&u.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Hc)))}return o!==null&&(o.visible=s!==null),u!==null&&(u.visible=r!==null),h!==null&&(h.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Xn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const Ml={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},An={h:0,s:0,l:0},Wi={h:0,s:0,l:0};function Ys(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class We{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ht){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,He.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=He.workingColorSpace){return this.r=e,this.g=t,this.b=n,He.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=He.workingColorSpace){if(e=Cc(e,1),t=ke(t,0,1),n=ke(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Ys(a,r,e+1/3),this.g=Ys(a,r,e),this.b=Ys(a,r,e-1/3)}return He.colorSpaceToWorking(this,s),this}setStyle(e,t=Ht){function n(r){r!==void 0&&parseFloat(r)<1&&Pe("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Pe("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Pe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ht){const n=Ml[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Pe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=vn(e.r),this.g=vn(e.g),this.b=vn(e.b),this}copyLinearToSRGB(e){return this.r=pi(e.r),this.g=pi(e.g),this.b=pi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ht){return He.workingToColorSpace(wt.copy(this),e),Math.round(ke(wt.r*255,0,255))*65536+Math.round(ke(wt.g*255,0,255))*256+Math.round(ke(wt.b*255,0,255))}getHexString(e=Ht){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=He.workingColorSpace){He.workingToColorSpace(wt.copy(this),t);const n=wt.r,s=wt.g,r=wt.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let u,h;const p=(o+a)/2;if(o===a)u=0,h=0;else{const m=a-o;switch(h=p<=.5?m/(a+o):m/(2-a-o),a){case n:u=(s-r)/m+(s<r?6:0);break;case s:u=(r-n)/m+2;break;case r:u=(n-s)/m+4;break}u/=6}return e.h=u,e.s=h,e.l=p,e}getRGB(e,t=He.workingColorSpace){return He.workingToColorSpace(wt.copy(this),t),e.r=wt.r,e.g=wt.g,e.b=wt.b,e}getStyle(e=Ht){He.workingToColorSpace(wt.copy(this),e);const t=wt.r,n=wt.g,s=wt.b;return e!==Ht?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(An),this.setHSL(An.h+e,An.s+t,An.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(An),e.getHSL(Wi);const n=Gs(An.h,Wi.h,t),s=Gs(An.s,Wi.s,t),r=Gs(An.l,Wi.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const wt=new We;We.NAMES=Ml;class Ea{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new We(e),this.near=t,this.far=n}clone(){return new Ea(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class kc extends yt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Un,this.environmentIntensity=1,this.environmentRotation=new Un,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const qt=new U,dn=new U,js=new U,fn=new U,ni=new U,ii=new U,uo=new U,Ks=new U,Zs=new U,$s=new U,Js=new dt,Qs=new dt,er=new dt;class jt{constructor(e=new U,t=new U,n=new U){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),qt.subVectors(e,t),s.cross(qt);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){qt.subVectors(s,t),dn.subVectors(n,t),js.subVectors(e,t);const a=qt.dot(qt),o=qt.dot(dn),u=qt.dot(js),h=dn.dot(dn),p=dn.dot(js),m=a*h-o*o;if(m===0)return r.set(0,0,0),null;const d=1/m,_=(h*u-o*p)*d,v=(a*p-o*u)*d;return r.set(1-_-v,v,_)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,fn)===null?!1:fn.x>=0&&fn.y>=0&&fn.x+fn.y<=1}static getInterpolation(e,t,n,s,r,a,o,u){return this.getBarycoord(e,t,n,s,fn)===null?(u.x=0,u.y=0,"z"in u&&(u.z=0),"w"in u&&(u.w=0),null):(u.setScalar(0),u.addScaledVector(r,fn.x),u.addScaledVector(a,fn.y),u.addScaledVector(o,fn.z),u)}static getInterpolatedAttribute(e,t,n,s,r,a){return Js.setScalar(0),Qs.setScalar(0),er.setScalar(0),Js.fromBufferAttribute(e,t),Qs.fromBufferAttribute(e,n),er.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Js,r.x),a.addScaledVector(Qs,r.y),a.addScaledVector(er,r.z),a}static isFrontFacing(e,t,n,s){return qt.subVectors(n,t),dn.subVectors(e,t),qt.cross(dn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return qt.subVectors(this.c,this.b),dn.subVectors(this.a,this.b),qt.cross(dn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return jt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return jt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return jt.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return jt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return jt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,r=this.c;let a,o;ni.subVectors(s,n),ii.subVectors(r,n),Ks.subVectors(e,n);const u=ni.dot(Ks),h=ii.dot(Ks);if(u<=0&&h<=0)return t.copy(n);Zs.subVectors(e,s);const p=ni.dot(Zs),m=ii.dot(Zs);if(p>=0&&m<=p)return t.copy(s);const d=u*m-p*h;if(d<=0&&u>=0&&p<=0)return a=u/(u-p),t.copy(n).addScaledVector(ni,a);$s.subVectors(e,r);const _=ni.dot($s),v=ii.dot($s);if(v>=0&&_<=v)return t.copy(r);const S=_*h-u*v;if(S<=0&&h>=0&&v<=0)return o=h/(h-v),t.copy(n).addScaledVector(ii,o);const f=p*v-_*m;if(f<=0&&m-p>=0&&_-v>=0)return uo.subVectors(r,s),o=(m-p)/(m-p+(_-v)),t.copy(s).addScaledVector(uo,o);const l=1/(f+S+d);return a=S*l,o=d*l,t.copy(n).addScaledVector(ni,a).addScaledVector(ii,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Oi{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Yt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Yt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Yt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Yt):Yt.fromBufferAttribute(r,a),Yt.applyMatrix4(e.matrixWorld),this.expandByPoint(Yt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Xi.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Xi.copy(n.boundingBox)),Xi.applyMatrix4(e.matrixWorld),this.union(Xi)}const s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Yt),Yt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ti),qi.subVectors(this.max,Ti),si.subVectors(e.a,Ti),ri.subVectors(e.b,Ti),ai.subVectors(e.c,Ti),wn.subVectors(ri,si),Rn.subVectors(ai,ri),Fn.subVectors(si,ai);let t=[0,-wn.z,wn.y,0,-Rn.z,Rn.y,0,-Fn.z,Fn.y,wn.z,0,-wn.x,Rn.z,0,-Rn.x,Fn.z,0,-Fn.x,-wn.y,wn.x,0,-Rn.y,Rn.x,0,-Fn.y,Fn.x,0];return!tr(t,si,ri,ai,qi)||(t=[1,0,0,0,1,0,0,0,1],!tr(t,si,ri,ai,qi))?!1:(Yi.crossVectors(wn,Rn),t=[Yi.x,Yi.y,Yi.z],tr(t,si,ri,ai,qi))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Yt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Yt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(pn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),pn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),pn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),pn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),pn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),pn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),pn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),pn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(pn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const pn=[new U,new U,new U,new U,new U,new U,new U,new U],Yt=new U,Xi=new Oi,si=new U,ri=new U,ai=new U,wn=new U,Rn=new U,Fn=new U,Ti=new U,qi=new U,Yi=new U,On=new U;function tr(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){On.fromArray(i,r);const o=s.x*Math.abs(On.x)+s.y*Math.abs(On.y)+s.z*Math.abs(On.z),u=e.dot(On),h=t.dot(On),p=n.dot(On);if(Math.max(-Math.max(u,h,p),Math.min(u,h,p))>o)return!1}return!0}const gt=new U,ji=new qe;let Wc=0;class Wt extends jn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Wc++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Za,this.updateRanges=[],this.gpuType=sn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)ji.fromBufferAttribute(this,t),ji.applyMatrix3(e),this.setXY(t,ji.x,ji.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix3(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyMatrix4(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.applyNormalMatrix(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)gt.fromBufferAttribute(this,t),gt.transformDirection(e),this.setXYZ(t,gt.x,gt.y,gt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Ei(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Dt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ei(t,this.array)),t}setX(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ei(t,this.array)),t}setY(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ei(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ei(t,this.array)),t}setW(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),s=Dt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),n=Dt(n,this.array),s=Dt(s,this.array),r=Dt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Za&&(e.usage=this.usage),e}dispose(){this.dispatchEvent({type:"dispose"})}}class Sl extends Wt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class El extends Wt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class lt extends Wt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const Xc=new Oi,bi=new U,nr=new U;class Ps{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Xc.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;bi.subVectors(e,this.center);const t=bi.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(bi,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(nr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(bi.copy(e.center).add(nr)),this.expandByPoint(bi.copy(e.center).sub(nr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let qc=0;const Vt=new ut,ir=new yt,oi=new U,Ft=new Oi,Ai=new Oi,Mt=new U;class Tt extends jn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:qc++}),this.uuid=Fi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(bc(e)?El:Sl)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Ie().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Vt.makeRotationFromQuaternion(e),this.applyMatrix4(Vt),this}rotateX(e){return Vt.makeRotationX(e),this.applyMatrix4(Vt),this}rotateY(e){return Vt.makeRotationY(e),this.applyMatrix4(Vt),this}rotateZ(e){return Vt.makeRotationZ(e),this.applyMatrix4(Vt),this}translate(e,t,n){return Vt.makeTranslation(e,t,n),this.applyMatrix4(Vt),this}scale(e,t,n){return Vt.makeScale(e,t,n),this.applyMatrix4(Vt),this}lookAt(e){return ir.lookAt(e),ir.updateMatrix(),this.applyMatrix4(ir.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(oi).negate(),this.translate(oi.x,oi.y,oi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let s=0,r=e.length;s<r;s++){const a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new lt(n,3))}else{const n=Math.min(e.length,t.count);for(let s=0;s<n;s++){const r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Pe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Oi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const r=t[n];Ft.setFromBufferAttribute(r),this.morphTargetsRelative?(Mt.addVectors(this.boundingBox.min,Ft.min),this.boundingBox.expandByPoint(Mt),Mt.addVectors(this.boundingBox.max,Ft.max),this.boundingBox.expandByPoint(Mt)):(this.boundingBox.expandByPoint(Ft.min),this.boundingBox.expandByPoint(Ft.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Xe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ps);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){const n=this.boundingSphere.center;if(Ft.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];Ai.setFromBufferAttribute(o),this.morphTargetsRelative?(Mt.addVectors(Ft.min,Ai.min),Ft.expandByPoint(Mt),Mt.addVectors(Ft.max,Ai.max),Ft.expandByPoint(Mt)):(Ft.expandByPoint(Ai.min),Ft.expandByPoint(Ai.max))}Ft.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Mt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Mt));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],u=this.morphTargetsRelative;for(let h=0,p=o.count;h<p;h++)Mt.fromBufferAttribute(o,h),u&&(oi.fromBufferAttribute(e,h),Mt.add(oi)),s=Math.max(s,n.distanceToSquared(Mt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Xe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Xe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Wt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],u=[];for(let g=0;g<n.count;g++)o[g]=new U,u[g]=new U;const h=new U,p=new U,m=new U,d=new qe,_=new qe,v=new qe,S=new U,f=new U;function l(g,A,L){h.fromBufferAttribute(n,g),p.fromBufferAttribute(n,A),m.fromBufferAttribute(n,L),d.fromBufferAttribute(r,g),_.fromBufferAttribute(r,A),v.fromBufferAttribute(r,L),p.sub(h),m.sub(h),_.sub(d),v.sub(d);const C=1/(_.x*v.y-v.x*_.y);isFinite(C)&&(S.copy(p).multiplyScalar(v.y).addScaledVector(m,-_.y).multiplyScalar(C),f.copy(m).multiplyScalar(_.x).addScaledVector(p,-v.x).multiplyScalar(C),o[g].add(S),o[A].add(S),o[L].add(S),u[g].add(f),u[A].add(f),u[L].add(f))}let x=this.groups;x.length===0&&(x=[{start:0,count:e.count}]);for(let g=0,A=x.length;g<A;++g){const L=x[g],C=L.start,G=L.count;for(let Z=C,$=C+G;Z<$;Z+=3)l(e.getX(Z+0),e.getX(Z+1),e.getX(Z+2))}const y=new U,T=new U,P=new U,b=new U;function I(g){P.fromBufferAttribute(s,g),b.copy(P);const A=o[g];y.copy(A),y.sub(P.multiplyScalar(P.dot(A))).normalize(),T.crossVectors(b,A);const C=T.dot(u[g])<0?-1:1;a.setXYZW(g,y.x,y.y,y.z,C)}for(let g=0,A=x.length;g<A;++g){const L=x[g],C=L.start,G=L.count;for(let Z=C,$=C+G;Z<$;Z+=3)I(e.getX(Z+0)),I(e.getX(Z+1)),I(e.getX(Z+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Wt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,_=n.count;d<_;d++)n.setXYZ(d,0,0,0);const s=new U,r=new U,a=new U,o=new U,u=new U,h=new U,p=new U,m=new U;if(e)for(let d=0,_=e.count;d<_;d+=3){const v=e.getX(d+0),S=e.getX(d+1),f=e.getX(d+2);s.fromBufferAttribute(t,v),r.fromBufferAttribute(t,S),a.fromBufferAttribute(t,f),p.subVectors(a,r),m.subVectors(s,r),p.cross(m),o.fromBufferAttribute(n,v),u.fromBufferAttribute(n,S),h.fromBufferAttribute(n,f),o.add(p),u.add(p),h.add(p),n.setXYZ(v,o.x,o.y,o.z),n.setXYZ(S,u.x,u.y,u.z),n.setXYZ(f,h.x,h.y,h.z)}else for(let d=0,_=t.count;d<_;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),p.subVectors(a,r),m.subVectors(s,r),p.cross(m),n.setXYZ(d+0,p.x,p.y,p.z),n.setXYZ(d+1,p.x,p.y,p.z),n.setXYZ(d+2,p.x,p.y,p.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Mt.fromBufferAttribute(e,t),Mt.normalize(),e.setXYZ(t,Mt.x,Mt.y,Mt.z)}toNonIndexed(){function e(o,u){const h=o.array,p=o.itemSize,m=o.normalized,d=new h.constructor(u.length*p);let _=0,v=0;for(let S=0,f=u.length;S<f;S++){o.isInterleavedBufferAttribute?_=u[S]*o.data.stride+o.offset:_=u[S]*p;for(let l=0;l<p;l++)d[v++]=h[_++]}return new Wt(d,p,m)}if(this.index===null)return Pe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Tt,n=this.index.array,s=this.attributes;for(const o in s){const u=s[o],h=e(u,n);t.setAttribute(o,h)}const r=this.morphAttributes;for(const o in r){const u=[],h=r[o];for(let p=0,m=h.length;p<m;p++){const d=h[p],_=e(d,n);u.push(_)}t.morphAttributes[o]=u}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,u=a.length;o<u;o++){const h=a[o];t.addGroup(h.start,h.count,h.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const u=this.parameters;for(const h in u)u[h]!==void 0&&(e[h]=u[h]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const u in n){const h=n[u];e.data.attributes[u]=h.toJSON(e.data)}const s={};let r=!1;for(const u in this.morphAttributes){const h=this.morphAttributes[u],p=[];for(let m=0,d=h.length;m<d;m++){const _=h[m];p.push(_.toJSON(e.data))}p.length>0&&(s[u]=p,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const s=e.attributes;for(const h in s){const p=s[h];this.setAttribute(h,p.clone(t))}const r=e.morphAttributes;for(const h in r){const p=[],m=r[h];for(let d=0,_=m.length;d<_;d++)p.push(m[d].clone(t));this.morphAttributes[h]=p}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let h=0,p=a.length;h<p;h++){const m=a[h];this.addGroup(m.start,m.count,m.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const u=e.boundingSphere;return u!==null&&(this.boundingSphere=u.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}let Yc=0;class Mi extends jn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Yc++}),this.uuid=Fi(),this.name="",this.type="Material",this.blending=fi,this.side=In,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=xr,this.blendDst=vr,this.blendEquation=Vn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new We(0,0,0),this.blendAlpha=0,this.depthFunc=mi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ka,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=$n,this.stencilZFail=$n,this.stencilZPass=$n,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Pe(`Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Pe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==fi&&(n.blending=this.blending),this.side!==In&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==xr&&(n.blendSrc=this.blendSrc),this.blendDst!==vr&&(n.blendDst=this.blendDst),this.blendEquation!==Vn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==mi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ka&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==$n&&(n.stencilFail=this.stencilFail),this.stencilZFail!==$n&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==$n&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const u=r[o];delete u.metadata,a.push(u)}return a}if(t){const r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const mn=new U,sr=new U,Ki=new U,Cn=new U,rr=new U,Zi=new U,ar=new U;class ya{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,mn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=mn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(mn.copy(this.origin).addScaledVector(this.direction,t),mn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){sr.copy(e).add(t).multiplyScalar(.5),Ki.copy(t).sub(e).normalize(),Cn.copy(this.origin).sub(sr);const r=e.distanceTo(t)*.5,a=-this.direction.dot(Ki),o=Cn.dot(this.direction),u=-Cn.dot(Ki),h=Cn.lengthSq(),p=Math.abs(1-a*a);let m,d,_,v;if(p>0)if(m=a*u-o,d=a*o-u,v=r*p,m>=0)if(d>=-v)if(d<=v){const S=1/p;m*=S,d*=S,_=m*(m+a*d+2*o)+d*(a*m+d+2*u)+h}else d=r,m=Math.max(0,-(a*d+o)),_=-m*m+d*(d+2*u)+h;else d=-r,m=Math.max(0,-(a*d+o)),_=-m*m+d*(d+2*u)+h;else d<=-v?(m=Math.max(0,-(-a*r+o)),d=m>0?-r:Math.min(Math.max(-r,-u),r),_=-m*m+d*(d+2*u)+h):d<=v?(m=0,d=Math.min(Math.max(-r,-u),r),_=d*(d+2*u)+h):(m=Math.max(0,-(a*r+o)),d=m>0?r:Math.min(Math.max(-r,-u),r),_=-m*m+d*(d+2*u)+h);else d=a>0?-r:r,m=Math.max(0,-(a*d+o)),_=-m*m+d*(d+2*u)+h;return n&&n.copy(this.origin).addScaledVector(this.direction,m),s&&s.copy(sr).addScaledVector(Ki,d),_}intersectSphere(e,t){mn.subVectors(e.center,this.origin);const n=mn.dot(this.direction),s=mn.dot(mn)-n*n,r=e.radius*e.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,u=n+a;return u<0?null:o<0?this.at(u,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,u;const h=1/this.direction.x,p=1/this.direction.y,m=1/this.direction.z,d=this.origin;return h>=0?(n=(e.min.x-d.x)*h,s=(e.max.x-d.x)*h):(n=(e.max.x-d.x)*h,s=(e.min.x-d.x)*h),p>=0?(r=(e.min.y-d.y)*p,a=(e.max.y-d.y)*p):(r=(e.max.y-d.y)*p,a=(e.min.y-d.y)*p),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),m>=0?(o=(e.min.z-d.z)*m,u=(e.max.z-d.z)*m):(o=(e.max.z-d.z)*m,u=(e.min.z-d.z)*m),n>u||o>s)||((o>n||n!==n)&&(n=o),(u<s||s!==s)&&(s=u),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,mn)!==null}intersectTriangle(e,t,n,s,r){rr.subVectors(t,e),Zi.subVectors(n,e),ar.crossVectors(rr,Zi);let a=this.direction.dot(ar),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Cn.subVectors(this.origin,e);const u=o*this.direction.dot(Zi.crossVectors(Cn,Zi));if(u<0)return null;const h=o*this.direction.dot(rr.cross(Cn));if(h<0||u+h>a)return null;const p=-o*Cn.dot(ar);return p<0?null:this.at(p/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Ta extends Mi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new We(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Un,this.combine=nl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ho=new ut,Bn=new ya,$i=new Ps,fo=new U,Ji=new U,Qi=new U,es=new U,or=new U,ts=new U,po=new U,ns=new U;class ct extends yt{constructor(e=new Tt,t=new Ta){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const o=this.morphTargetInfluences;if(r&&o){ts.set(0,0,0);for(let u=0,h=r.length;u<h;u++){const p=o[u],m=r[u];p!==0&&(or.fromBufferAttribute(m,e),a?ts.addScaledVector(or,p):ts.addScaledVector(or.sub(t),p))}t.add(ts)}return t}raycast(e,t){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),$i.copy(n.boundingSphere),$i.applyMatrix4(r),Bn.copy(e.ray).recast(e.near),!($i.containsPoint(Bn.origin)===!1&&(Bn.intersectSphere($i,fo)===null||Bn.origin.distanceToSquared(fo)>(e.far-e.near)**2))&&(ho.copy(r).invert(),Bn.copy(e.ray).applyMatrix4(ho),!(n.boundingBox!==null&&Bn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Bn)))}_computeIntersections(e,t,n){let s;const r=this.geometry,a=this.material,o=r.index,u=r.attributes.position,h=r.attributes.uv,p=r.attributes.uv1,m=r.attributes.normal,d=r.groups,_=r.drawRange;if(o!==null)if(Array.isArray(a))for(let v=0,S=d.length;v<S;v++){const f=d[v],l=a[f.materialIndex],x=Math.max(f.start,_.start),y=Math.min(o.count,Math.min(f.start+f.count,_.start+_.count));for(let T=x,P=y;T<P;T+=3){const b=o.getX(T),I=o.getX(T+1),g=o.getX(T+2);s=is(this,l,e,n,h,p,m,b,I,g),s&&(s.faceIndex=Math.floor(T/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{const v=Math.max(0,_.start),S=Math.min(o.count,_.start+_.count);for(let f=v,l=S;f<l;f+=3){const x=o.getX(f),y=o.getX(f+1),T=o.getX(f+2);s=is(this,a,e,n,h,p,m,x,y,T),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}else if(u!==void 0)if(Array.isArray(a))for(let v=0,S=d.length;v<S;v++){const f=d[v],l=a[f.materialIndex],x=Math.max(f.start,_.start),y=Math.min(u.count,Math.min(f.start+f.count,_.start+_.count));for(let T=x,P=y;T<P;T+=3){const b=T,I=T+1,g=T+2;s=is(this,l,e,n,h,p,m,b,I,g),s&&(s.faceIndex=Math.floor(T/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{const v=Math.max(0,_.start),S=Math.min(u.count,_.start+_.count);for(let f=v,l=S;f<l;f+=3){const x=f,y=f+1,T=f+2;s=is(this,a,e,n,h,p,m,x,y,T),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}}}function jc(i,e,t,n,s,r,a,o){let u;if(e.side===It?u=n.intersectTriangle(a,r,s,!0,o):u=n.intersectTriangle(s,r,a,e.side===In,o),u===null)return null;ns.copy(o),ns.applyMatrix4(i.matrixWorld);const h=t.ray.origin.distanceTo(ns);return h<t.near||h>t.far?null:{distance:h,point:ns.clone(),object:i}}function is(i,e,t,n,s,r,a,o,u,h){i.getVertexPosition(o,Ji),i.getVertexPosition(u,Qi),i.getVertexPosition(h,es);const p=jc(i,e,t,n,Ji,Qi,es,po);if(p){const m=new U;jt.getBarycoord(po,Ji,Qi,es,m),s&&(p.uv=jt.getInterpolatedAttribute(s,o,u,h,m,new qe)),r&&(p.uv1=jt.getInterpolatedAttribute(r,o,u,h,m,new qe)),a&&(p.normal=jt.getInterpolatedAttribute(a,o,u,h,m,new U),p.normal.dot(n.direction)>0&&p.normal.multiplyScalar(-1));const d={a:o,b:u,c:h,normal:new U,materialIndex:0};jt.getNormal(Ji,Qi,es,d.normal),p.face=d,p.barycoord=m}return p}class Kc extends Lt{constructor(e=null,t=1,n=1,s,r,a,o,u,h=Et,p=Et,m,d){super(null,a,o,u,h,p,s,r,m,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const lr=new U,Zc=new U,$c=new Ie;class Gn{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=lr.subVectors(n,t).cross(Zc.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const s=e.delta(lr),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||$c.getNormalMatrix(e),s=this.coplanarPoint(lr).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const zn=new Ps,Jc=new qe(.5,.5),ss=new U;class ba{constructor(e=new Gn,t=new Gn,n=new Gn,s=new Gn,r=new Gn,a=new Gn){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=rn,n=!1){const s=this.planes,r=e.elements,a=r[0],o=r[1],u=r[2],h=r[3],p=r[4],m=r[5],d=r[6],_=r[7],v=r[8],S=r[9],f=r[10],l=r[11],x=r[12],y=r[13],T=r[14],P=r[15];if(s[0].setComponents(h-a,_-p,l-v,P-x).normalize(),s[1].setComponents(h+a,_+p,l+v,P+x).normalize(),s[2].setComponents(h+o,_+m,l+S,P+y).normalize(),s[3].setComponents(h-o,_-m,l-S,P-y).normalize(),n)s[4].setComponents(u,d,f,T).normalize(),s[5].setComponents(h-u,_-d,l-f,P-T).normalize();else if(s[4].setComponents(h-u,_-d,l-f,P-T).normalize(),t===rn)s[5].setComponents(h+u,_+d,l+f,P+T).normalize();else if(t===Ni)s[5].setComponents(u,d,f,T).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),zn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),zn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(zn)}intersectsSprite(e){zn.center.set(0,0,0);const t=Jc.distanceTo(e.center);return zn.radius=.7071067811865476+t,zn.applyMatrix4(e.matrixWorld),this.intersectsSphere(zn)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(ss.x=s.normal.x>0?e.max.x:e.min.x,ss.y=s.normal.y>0?e.max.y:e.min.y,ss.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(ss)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Aa extends Mi{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new We(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const As=new U,ws=new U,mo=new ut,wi=new ya,rs=new Ps,cr=new U,_o=new U;class yl extends yt{constructor(e=new Tt,t=new Aa){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)As.fromBufferAttribute(t,s-1),ws.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=As.distanceTo(ws);e.setAttribute("lineDistance",new lt(n,1))}else Pe("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),rs.copy(n.boundingSphere),rs.applyMatrix4(s),rs.radius+=r,e.ray.intersectsSphere(rs)===!1)return;mo.copy(s).invert(),wi.copy(e.ray).applyMatrix4(mo);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),u=o*o,h=this.isLineSegments?2:1,p=n.index,d=n.attributes.position;if(p!==null){const _=Math.max(0,a.start),v=Math.min(p.count,a.start+a.count);for(let S=_,f=v-1;S<f;S+=h){const l=p.getX(S),x=p.getX(S+1),y=as(this,e,wi,u,l,x,S);y&&t.push(y)}if(this.isLineLoop){const S=p.getX(v-1),f=p.getX(_),l=as(this,e,wi,u,S,f,v-1);l&&t.push(l)}}else{const _=Math.max(0,a.start),v=Math.min(d.count,a.start+a.count);for(let S=_,f=v-1;S<f;S+=h){const l=as(this,e,wi,u,S,S+1,S);l&&t.push(l)}if(this.isLineLoop){const S=as(this,e,wi,u,v-1,_,v-1);S&&t.push(S)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function as(i,e,t,n,s,r,a){const o=i.geometry.attributes.position;if(As.fromBufferAttribute(o,s),ws.fromBufferAttribute(o,r),t.distanceSqToSegment(As,ws,cr,_o)>n)return;cr.applyMatrix4(i.matrixWorld);const h=e.ray.origin.distanceTo(cr);if(!(h<e.near||h>e.far))return{distance:h,point:_o.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}const go=new U,xo=new U;class Qc extends yl{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)go.fromBufferAttribute(t,s),xo.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+go.distanceTo(xo);e.setAttribute("lineDistance",new lt(n,1))}else Pe("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Tl extends Lt{constructor(e=[],t=qn,n,s,r,a,o,u,h,p){super(e,t,n,s,r,a,o,u,h,p),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class gi extends Lt{constructor(e,t,n=ln,s,r,a,o=Et,u=Et,h,p=Sn,m=1){if(p!==Sn&&p!==Wn)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:m};super(d,s,r,a,o,u,p,n,h),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ma(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class eu extends gi{constructor(e,t=ln,n=qn,s,r,a=Et,o=Et,u,h=Sn){const p={width:e,height:e,depth:1},m=[p,p,p,p,p,p];super(e,e,t,n,s,r,a,o,u,h),this.image=m,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class bl extends Lt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Bt extends Tt{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const u=[],h=[],p=[],m=[];let d=0,_=0;v("z","y","x",-1,-1,n,t,e,a,r,0),v("z","y","x",1,-1,n,t,-e,a,r,1),v("x","z","y",1,1,e,n,t,s,a,2),v("x","z","y",1,-1,e,n,-t,s,a,3),v("x","y","z",1,-1,e,t,n,s,r,4),v("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(u),this.setAttribute("position",new lt(h,3)),this.setAttribute("normal",new lt(p,3)),this.setAttribute("uv",new lt(m,2));function v(S,f,l,x,y,T,P,b,I,g,A){const L=T/I,C=P/g,G=T/2,Z=P/2,$=b/2,B=I+1,V=g+1;let j=0,ne=0;const ie=new U;for(let le=0;le<V;le++){const ve=le*C-Z;for(let Te=0;Te<B;Te++){const Ve=Te*L-G;ie[S]=Ve*x,ie[f]=ve*y,ie[l]=$,h.push(ie.x,ie.y,ie.z),ie[S]=0,ie[f]=0,ie[l]=b>0?1:-1,p.push(ie.x,ie.y,ie.z),m.push(Te/I),m.push(1-le/g),j+=1}}for(let le=0;le<g;le++)for(let ve=0;ve<I;ve++){const Te=d+ve+B*le,Ve=d+ve+B*(le+1),Ke=d+(ve+1)+B*(le+1),De=d+(ve+1)+B*le;u.push(Te,Ve,De),u.push(Ve,Ke,De),ne+=6}o.addGroup(_,ne,A),_+=ne,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Bt(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class wa extends Tt{constructor(e=1,t=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:n,radialSegments:s,heightSegments:r},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));const a=[],o=[],u=[],h=[],p=t/2,m=Math.PI/2*e,d=t,_=2*m+d,v=n*2+r,S=s+1,f=new U,l=new U;for(let x=0;x<=v;x++){let y=0,T=0,P=0,b=0;if(x<=n){const A=x/n,L=A*Math.PI/2;T=-p-e*Math.cos(L),P=e*Math.sin(L),b=-e*Math.cos(L),y=A*m}else if(x<=n+r){const A=(x-n)/r;T=-p+A*t,P=e,b=0,y=m+A*d}else{const A=(x-n-r)/n,L=A*Math.PI/2;T=p+e*Math.sin(L),P=e*Math.cos(L),b=e*Math.sin(L),y=m+d+A*m}const I=Math.max(0,Math.min(1,y/_));let g=0;x===0?g=.5/s:x===v&&(g=-.5/s);for(let A=0;A<=s;A++){const L=A/s,C=L*Math.PI*2,G=Math.sin(C),Z=Math.cos(C);l.x=-P*Z,l.y=T,l.z=P*G,o.push(l.x,l.y,l.z),f.set(-P*Z,b,P*G),f.normalize(),u.push(f.x,f.y,f.z),h.push(L+g,I)}if(x>0){const A=(x-1)*S;for(let L=0;L<s;L++){const C=A+L,G=A+L+1,Z=x*S+L,$=x*S+L+1;a.push(C,G,Z),a.push(G,$,Z)}}}this.setIndex(a),this.setAttribute("position",new lt(o,3)),this.setAttribute("normal",new lt(u,3)),this.setAttribute("uv",new lt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new wa(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}}class Ra extends Tt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};const r=[],a=[];o(s),h(n),p(),this.setAttribute("position",new lt(r,3)),this.setAttribute("normal",new lt(r.slice(),3)),this.setAttribute("uv",new lt(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(x){const y=new U,T=new U,P=new U;for(let b=0;b<t.length;b+=3)_(t[b+0],y),_(t[b+1],T),_(t[b+2],P),u(y,T,P,x)}function u(x,y,T,P){const b=P+1,I=[];for(let g=0;g<=b;g++){I[g]=[];const A=x.clone().lerp(T,g/b),L=y.clone().lerp(T,g/b),C=b-g;for(let G=0;G<=C;G++)G===0&&g===b?I[g][G]=A:I[g][G]=A.clone().lerp(L,G/C)}for(let g=0;g<b;g++)for(let A=0;A<2*(b-g)-1;A++){const L=Math.floor(A/2);A%2===0?(d(I[g][L+1]),d(I[g+1][L]),d(I[g][L])):(d(I[g][L+1]),d(I[g+1][L+1]),d(I[g+1][L]))}}function h(x){const y=new U;for(let T=0;T<r.length;T+=3)y.x=r[T+0],y.y=r[T+1],y.z=r[T+2],y.normalize().multiplyScalar(x),r[T+0]=y.x,r[T+1]=y.y,r[T+2]=y.z}function p(){const x=new U;for(let y=0;y<r.length;y+=3){x.x=r[y+0],x.y=r[y+1],x.z=r[y+2];const T=f(x)/2/Math.PI+.5,P=l(x)/Math.PI+.5;a.push(T,1-P)}v(),m()}function m(){for(let x=0;x<a.length;x+=6){const y=a[x+0],T=a[x+2],P=a[x+4],b=Math.max(y,T,P),I=Math.min(y,T,P);b>.9&&I<.1&&(y<.2&&(a[x+0]+=1),T<.2&&(a[x+2]+=1),P<.2&&(a[x+4]+=1))}}function d(x){r.push(x.x,x.y,x.z)}function _(x,y){const T=x*3;y.x=e[T+0],y.y=e[T+1],y.z=e[T+2]}function v(){const x=new U,y=new U,T=new U,P=new U,b=new qe,I=new qe,g=new qe;for(let A=0,L=0;A<r.length;A+=9,L+=6){x.set(r[A+0],r[A+1],r[A+2]),y.set(r[A+3],r[A+4],r[A+5]),T.set(r[A+6],r[A+7],r[A+8]),b.set(a[L+0],a[L+1]),I.set(a[L+2],a[L+3]),g.set(a[L+4],a[L+5]),P.copy(x).add(y).add(T).divideScalar(3);const C=f(P);S(b,L+0,x,C),S(I,L+2,y,C),S(g,L+4,T,C)}}function S(x,y,T,P){P<0&&x.x===1&&(a[y]=x.x-1),T.x===0&&T.z===0&&(a[y]=P/2/Math.PI+.5)}function f(x){return Math.atan2(x.z,-x.x)}function l(x){return Math.atan2(-x.y,Math.sqrt(x.x*x.x+x.z*x.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ra(e.vertices,e.indices,e.radius,e.detail)}}class Ca extends Ra{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new Ca(e.radius,e.detail)}}class Bi extends Tt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const r=e/2,a=t/2,o=Math.floor(n),u=Math.floor(s),h=o+1,p=u+1,m=e/o,d=t/u,_=[],v=[],S=[],f=[];for(let l=0;l<p;l++){const x=l*d-a;for(let y=0;y<h;y++){const T=y*m-r;v.push(T,-x,0),S.push(0,0,1),f.push(y/o),f.push(1-l/u)}}for(let l=0;l<u;l++)for(let x=0;x<o;x++){const y=x+h*l,T=x+h*(l+1),P=x+1+h*(l+1),b=x+1+h*l;_.push(y,T,b),_.push(T,P,b)}this.setIndex(_),this.setAttribute("position",new lt(v,3)),this.setAttribute("normal",new lt(S,3)),this.setAttribute("uv",new lt(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Bi(e.width,e.height,e.widthSegments,e.heightSegments)}}class Di extends Tt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const u=Math.min(a+o,Math.PI);let h=0;const p=[],m=new U,d=new U,_=[],v=[],S=[],f=[];for(let l=0;l<=n;l++){const x=[],y=l/n;let T=0;l===0&&a===0?T=.5/t:l===n&&u===Math.PI&&(T=-.5/t);for(let P=0;P<=t;P++){const b=P/t;m.x=-e*Math.cos(s+b*r)*Math.sin(a+y*o),m.y=e*Math.cos(a+y*o),m.z=e*Math.sin(s+b*r)*Math.sin(a+y*o),v.push(m.x,m.y,m.z),d.copy(m).normalize(),S.push(d.x,d.y,d.z),f.push(b+T,1-y),x.push(h++)}p.push(x)}for(let l=0;l<n;l++)for(let x=0;x<t;x++){const y=p[l][x+1],T=p[l][x],P=p[l+1][x],b=p[l+1][x+1];(l!==0||a>0)&&_.push(y,T,b),(l!==n-1||u<Math.PI)&&_.push(T,P,b)}this.setIndex(_),this.setAttribute("position",new lt(v,3)),this.setAttribute("normal",new lt(S,3)),this.setAttribute("uv",new lt(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Di(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Pa extends Tt{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);const u=[],h=[],p=[],m=[],d=new U,_=new U,v=new U;for(let S=0;S<=n;S++){const f=a+S/n*o;for(let l=0;l<=s;l++){const x=l/s*r;_.x=(e+t*Math.cos(f))*Math.cos(x),_.y=(e+t*Math.cos(f))*Math.sin(x),_.z=t*Math.sin(f),h.push(_.x,_.y,_.z),d.x=e*Math.cos(x),d.y=e*Math.sin(x),v.subVectors(_,d).normalize(),p.push(v.x,v.y,v.z),m.push(l/s),m.push(S/n)}}for(let S=1;S<=n;S++)for(let f=1;f<=s;f++){const l=(s+1)*S+f-1,x=(s+1)*(S-1)+f-1,y=(s+1)*(S-1)+f,T=(s+1)*S+f;u.push(l,x,T),u.push(x,y,T)}this.setIndex(u),this.setAttribute("position",new lt(h,3)),this.setAttribute("normal",new lt(p,3)),this.setAttribute("uv",new lt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Pa(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}function xi(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const s=i[t][n];if(vo(s))s.isRenderTargetTexture?(Pe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(vo(s[0])){const r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Pt(i){const e={};for(let t=0;t<i.length;t++){const n=xi(i[t]);for(const s in n)e[s]=n[s]}return e}function vo(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function tu(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Al(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:He.workingColorSpace}const nu={clone:xi,merge:Pt};var iu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,su=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class cn extends Mi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=iu,this.fragmentShader=su,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=xi(e.uniforms),this.uniformsGroups=tu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class ru extends cn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Ot extends Mi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new We(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new We(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ra,this.normalScale=new qe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Un,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class au extends Mi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=gc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class ou extends Mi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class wl extends yt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new We(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}const ur=new ut,Mo=new U,So=new U;class lu{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new qe(512,512),this.mapType=zt,this.map=null,this.mapPass=null,this.matrix=new ut,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ba,this._frameExtents=new qe(1,1),this._viewportCount=1,this._viewports=[new dt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Mo.setFromMatrixPosition(e.matrixWorld),t.position.copy(Mo),So.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(So),t.updateMatrixWorld(),ur.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ur,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===Ni||t.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ur)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const os=new U,ls=new vi,Jt=new U;class Rl extends yt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ut,this.projectionMatrix=new ut,this.projectionMatrixInverse=new ut,this.coordinateSystem=rn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(os,ls,Jt),Jt.x===1&&Jt.y===1&&Jt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(os,ls,Jt.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(os,ls,Jt),Jt.x===1&&Jt.y===1&&Jt.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(os,ls,Jt.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Pn=new U,Eo=new qe,yo=new qe;class kt extends Rl{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=oa*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(zs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return oa*2*Math.atan(Math.tan(zs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Pn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Pn.x,Pn.y).multiplyScalar(-e/Pn.z),Pn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Pn.x,Pn.y).multiplyScalar(-e/Pn.z)}getViewSize(e,t){return this.getViewBounds(e,Eo,yo),t.subVectors(yo,Eo)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(zs*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const u=a.fullWidth,h=a.fullHeight;r+=a.offsetX*s/u,t-=a.offsetY*n/h,s*=a.width/u,n*=a.height/h}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class La extends Rl{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=s+t,u=s-t;if(this.view!==null&&this.view.enabled){const h=(this.right-this.left)/this.view.fullWidth/this.zoom,p=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=h*this.view.offsetX,a=r+h*this.view.width,o-=p*this.view.offsetY,u=o-p*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,u,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class cu extends lu{constructor(){super(new La(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class uu extends wl{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.target=new yt,this.shadow=new cu}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class hu extends wl{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}const li=-90,ci=1;class du extends yt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new kt(li,ci,e,t);s.layers=this.layers,this.add(s);const r=new kt(li,ci,e,t);r.layers=this.layers,this.add(r);const a=new kt(li,ci,e,t);a.layers=this.layers,this.add(a);const o=new kt(li,ci,e,t);o.layers=this.layers,this.add(o);const u=new kt(li,ci,e,t);u.layers=this.layers,this.add(u);const h=new kt(li,ci,e,t);h.layers=this.layers,this.add(h)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,u]=t;for(const h of t)this.remove(h);if(e===rn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),u.up.set(0,1,0),u.lookAt(0,0,-1);else if(e===Ni)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),u.up.set(0,-1,0),u.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const h of t)this.add(h),h.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,u,h,p]=this.children,m=e.getRenderTarget(),d=e.getActiveCubeFace(),_=e.getActiveMipmapLevel(),v=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let f=!1;e.isWebGLRenderer===!0?f=e.state.buffers.depth.getReversed():f=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(n,4,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),n.texture.generateMipmaps=S,e.setRenderTarget(n,5,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,p),e.setRenderTarget(m,d,_),e.xr.enabled=v,n.texture.needsPMREMUpdate=!0}}class fu extends kt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const To=new ut;class pu{constructor(e,t,n=0,s=1/0){this.ray=new ya(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new Sa,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Xe("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return To.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(To),this}intersectObject(e,t=!0,n=[]){return la(e,this,n,t),n.sort(bo),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)la(e[s],this,n,t);return n.sort(bo),n}}function bo(i,e){return i.distance-e.distance}function la(i,e,t,n){let s=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let a=0,o=r.length;a<o;a++)la(r[a],e,t,!0)}}class mu{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,Pe("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=performance.now();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}const Fa=class Fa{constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){const r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};Fa.prototype.isMatrix2=!0;let Ao=Fa;class _u extends Qc{constructor(e=10,t=10,n=4473924,s=8947848){n=new We(n),s=new We(s);const r=t/2,a=e/t,o=e/2,u=[],h=[];for(let d=0,_=0,v=-o;d<=t;d++,v+=a){u.push(-o,0,v,o,0,v),u.push(v,0,-o,v,0,o);const S=d===r?n:s;S.toArray(h,_),_+=3,S.toArray(h,_),_+=3,S.toArray(h,_),_+=3,S.toArray(h,_),_+=3}const p=new Tt;p.setAttribute("position",new lt(u,3)),p.setAttribute("color",new lt(h,3));const m=new Aa({vertexColors:!0,toneMapped:!1});super(p,m),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}function wo(i,e,t,n){const s=gu(n);switch(t){case ml:return i*e;case gl:return i*e/s.components*s.byteLength;case ma:return i*e/s.components*s.byteLength;case Yn:return i*e*2/s.components*s.byteLength;case _a:return i*e*2/s.components*s.byteLength;case _l:return i*e*3/s.components*s.byteLength;case Kt:return i*e*4/s.components*s.byteLength;case ga:return i*e*4/s.components*s.byteLength;case _s:case gs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case xs:case vs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Pr:case Dr:return Math.max(i,16)*Math.max(e,8)/4;case Cr:case Lr:return Math.max(i,8)*Math.max(e,8)/2;case Ir:case Ur:case Fr:case Or:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Nr:case Ss:case Br:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case zr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Gr:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Vr:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Hr:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case kr:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Wr:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Xr:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case qr:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Yr:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case jr:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Kr:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Zr:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case $r:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Jr:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Qr:case ea:case ta:return Math.ceil(i/4)*Math.ceil(e/4)*16;case na:case ia:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Es:case sa:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function gu(i){switch(i){case zt:case hl:return{byteLength:1,components:1};case Ii:case dl:case Mn:return{byteLength:2,components:1};case fa:case pa:return{byteLength:2,components:4};case ln:case da:case sn:return{byteLength:4,components:1};case fl:case pl:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ha}}));typeof window<"u"&&(window.__THREE__?Pe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ha);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Cl(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function xu(i){const e=new WeakMap;function t(o,u){const h=o.array,p=o.usage,m=h.byteLength,d=i.createBuffer();i.bindBuffer(u,d),i.bufferData(u,h,p),o.onUploadCallback();let _;if(h instanceof Float32Array)_=i.FLOAT;else if(typeof Float16Array<"u"&&h instanceof Float16Array)_=i.HALF_FLOAT;else if(h instanceof Uint16Array)o.isFloat16BufferAttribute?_=i.HALF_FLOAT:_=i.UNSIGNED_SHORT;else if(h instanceof Int16Array)_=i.SHORT;else if(h instanceof Uint32Array)_=i.UNSIGNED_INT;else if(h instanceof Int32Array)_=i.INT;else if(h instanceof Int8Array)_=i.BYTE;else if(h instanceof Uint8Array)_=i.UNSIGNED_BYTE;else if(h instanceof Uint8ClampedArray)_=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:d,type:_,bytesPerElement:h.BYTES_PER_ELEMENT,version:o.version,size:m}}function n(o,u,h){const p=u.array,m=u.updateRanges;if(i.bindBuffer(h,o),m.length===0)i.bufferSubData(h,0,p);else{m.sort((_,v)=>_.start-v.start);let d=0;for(let _=1;_<m.length;_++){const v=m[d],S=m[_];S.start<=v.start+v.count+1?v.count=Math.max(v.count,S.start+S.count-v.start):(++d,m[d]=S)}m.length=d+1;for(let _=0,v=m.length;_<v;_++){const S=m[_];i.bufferSubData(h,S.start*p.BYTES_PER_ELEMENT,p,S.start,S.count)}u.clearUpdateRanges()}u.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const u=e.get(o);u&&(i.deleteBuffer(u.buffer),e.delete(o))}function a(o,u){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const p=e.get(o);(!p||p.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const h=e.get(o);if(h===void 0)e.set(o,t(o,u));else if(h.version<o.version){if(h.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(h.buffer,o,u),h.version=o.version}}return{get:s,remove:r,update:a}}var vu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Mu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Su=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Eu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,yu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Tu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,bu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Au=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,wu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Ru=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Cu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Pu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Lu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Du=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Iu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Uu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Nu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Fu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ou=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Bu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,zu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Gu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Vu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Hu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ku=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Wu=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Xu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,qu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Yu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ju=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ku="gl_FragColor = linearToOutputTexel( gl_FragColor );",Zu=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,$u=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Ju=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Qu=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,eh=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,th=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,nh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ih=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,sh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,rh=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,ah=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,oh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ch=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,uh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,hh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,dh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,fh=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ph=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,mh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,_h=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,gh=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,xh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = inverseTransformDirection( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,vh=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Mh=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Sh=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Eh=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,yh=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Th=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,bh=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ah=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,wh=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Rh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Ch=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ph=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Lh=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Dh=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Ih=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Uh=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Nh=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Fh=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Oh=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Bh=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,zh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vh=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Hh=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,kh=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Wh=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Xh=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,qh=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Yh=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,jh=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Kh=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Zh=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,$h=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Jh=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Qh=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ed=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,td=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,nd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,id=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,sd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,rd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ad=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,od=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ld=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,cd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ud=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,hd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,dd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,fd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,pd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,md=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,_d=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,gd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,xd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const vd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Md=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Sd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ed=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Td=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,bd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Ad=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,wd=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Rd=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Cd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Pd=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ld=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Dd=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Id=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Ud=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Nd=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Fd=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Od=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Bd=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zd=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Gd=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Vd=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Hd=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,kd=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Wd=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xd=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qd=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yd=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,jd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Kd=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Zd=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$d=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Jd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Be={alphahash_fragment:vu,alphahash_pars_fragment:Mu,alphamap_fragment:Su,alphamap_pars_fragment:Eu,alphatest_fragment:yu,alphatest_pars_fragment:Tu,aomap_fragment:bu,aomap_pars_fragment:Au,batching_pars_vertex:wu,batching_vertex:Ru,begin_vertex:Cu,beginnormal_vertex:Pu,bsdfs:Lu,iridescence_fragment:Du,bumpmap_pars_fragment:Iu,clipping_planes_fragment:Uu,clipping_planes_pars_fragment:Nu,clipping_planes_pars_vertex:Fu,clipping_planes_vertex:Ou,color_fragment:Bu,color_pars_fragment:zu,color_pars_vertex:Gu,color_vertex:Vu,common:Hu,cube_uv_reflection_fragment:ku,defaultnormal_vertex:Wu,displacementmap_pars_vertex:Xu,displacementmap_vertex:qu,emissivemap_fragment:Yu,emissivemap_pars_fragment:ju,colorspace_fragment:Ku,colorspace_pars_fragment:Zu,envmap_fragment:$u,envmap_common_pars_fragment:Ju,envmap_pars_fragment:Qu,envmap_pars_vertex:eh,envmap_physical_pars_fragment:hh,envmap_vertex:th,fog_vertex:nh,fog_pars_vertex:ih,fog_fragment:sh,fog_pars_fragment:rh,gradientmap_pars_fragment:ah,lightmap_pars_fragment:oh,lights_lambert_fragment:lh,lights_lambert_pars_fragment:ch,lights_pars_begin:uh,lights_toon_fragment:dh,lights_toon_pars_fragment:fh,lights_phong_fragment:ph,lights_phong_pars_fragment:mh,lights_physical_fragment:_h,lights_physical_pars_fragment:gh,lights_fragment_begin:xh,lights_fragment_maps:vh,lights_fragment_end:Mh,lightprobes_pars_fragment:Sh,logdepthbuf_fragment:Eh,logdepthbuf_pars_fragment:yh,logdepthbuf_pars_vertex:Th,logdepthbuf_vertex:bh,map_fragment:Ah,map_pars_fragment:wh,map_particle_fragment:Rh,map_particle_pars_fragment:Ch,metalnessmap_fragment:Ph,metalnessmap_pars_fragment:Lh,morphinstance_vertex:Dh,morphcolor_vertex:Ih,morphnormal_vertex:Uh,morphtarget_pars_vertex:Nh,morphtarget_vertex:Fh,normal_fragment_begin:Oh,normal_fragment_maps:Bh,normal_pars_fragment:zh,normal_pars_vertex:Gh,normal_vertex:Vh,normalmap_pars_fragment:Hh,clearcoat_normal_fragment_begin:kh,clearcoat_normal_fragment_maps:Wh,clearcoat_pars_fragment:Xh,iridescence_pars_fragment:qh,opaque_fragment:Yh,packing:jh,premultiplied_alpha_fragment:Kh,project_vertex:Zh,dithering_fragment:$h,dithering_pars_fragment:Jh,roughnessmap_fragment:Qh,roughnessmap_pars_fragment:ed,shadowmap_pars_fragment:td,shadowmap_pars_vertex:nd,shadowmap_vertex:id,shadowmask_pars_fragment:sd,skinbase_vertex:rd,skinning_pars_vertex:ad,skinning_vertex:od,skinnormal_vertex:ld,specularmap_fragment:cd,specularmap_pars_fragment:ud,tonemapping_fragment:hd,tonemapping_pars_fragment:dd,transmission_fragment:fd,transmission_pars_fragment:pd,uv_pars_fragment:md,uv_pars_vertex:_d,uv_vertex:gd,worldpos_vertex:xd,background_vert:vd,background_frag:Md,backgroundCube_vert:Sd,backgroundCube_frag:Ed,cube_vert:yd,cube_frag:Td,depth_vert:bd,depth_frag:Ad,distance_vert:wd,distance_frag:Rd,equirect_vert:Cd,equirect_frag:Pd,linedashed_vert:Ld,linedashed_frag:Dd,meshbasic_vert:Id,meshbasic_frag:Ud,meshlambert_vert:Nd,meshlambert_frag:Fd,meshmatcap_vert:Od,meshmatcap_frag:Bd,meshnormal_vert:zd,meshnormal_frag:Gd,meshphong_vert:Vd,meshphong_frag:Hd,meshphysical_vert:kd,meshphysical_frag:Wd,meshtoon_vert:Xd,meshtoon_frag:qd,points_vert:Yd,points_frag:jd,shadow_vert:Kd,shadow_frag:Zd,sprite_vert:$d,sprite_frag:Jd},fe={common:{diffuse:{value:new We(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ie}},envmap:{envMap:{value:null},envMapRotation:{value:new Ie},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ie}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ie}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ie},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ie},normalScale:{value:new qe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ie},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ie}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ie}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ie}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new We(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new We(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0},uvTransform:{value:new Ie}},sprite:{diffuse:{value:new We(16777215)},opacity:{value:1},center:{value:new qe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ie},alphaMap:{value:null},alphaMapTransform:{value:new Ie},alphaTest:{value:0}}},nn={basic:{uniforms:Pt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.fog]),vertexShader:Be.meshbasic_vert,fragmentShader:Be.meshbasic_frag},lambert:{uniforms:Pt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new We(0)},envMapIntensity:{value:1}}]),vertexShader:Be.meshlambert_vert,fragmentShader:Be.meshlambert_frag},phong:{uniforms:Pt([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new We(0)},specular:{value:new We(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Be.meshphong_vert,fragmentShader:Be.meshphong_frag},standard:{uniforms:Pt([fe.common,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.roughnessmap,fe.metalnessmap,fe.fog,fe.lights,{emissive:{value:new We(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag},toon:{uniforms:Pt([fe.common,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.gradientmap,fe.fog,fe.lights,{emissive:{value:new We(0)}}]),vertexShader:Be.meshtoon_vert,fragmentShader:Be.meshtoon_frag},matcap:{uniforms:Pt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,{matcap:{value:null}}]),vertexShader:Be.meshmatcap_vert,fragmentShader:Be.meshmatcap_frag},points:{uniforms:Pt([fe.points,fe.fog]),vertexShader:Be.points_vert,fragmentShader:Be.points_frag},dashed:{uniforms:Pt([fe.common,fe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Be.linedashed_vert,fragmentShader:Be.linedashed_frag},depth:{uniforms:Pt([fe.common,fe.displacementmap]),vertexShader:Be.depth_vert,fragmentShader:Be.depth_frag},normal:{uniforms:Pt([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,{opacity:{value:1}}]),vertexShader:Be.meshnormal_vert,fragmentShader:Be.meshnormal_frag},sprite:{uniforms:Pt([fe.sprite,fe.fog]),vertexShader:Be.sprite_vert,fragmentShader:Be.sprite_frag},background:{uniforms:{uvTransform:{value:new Ie},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Be.background_vert,fragmentShader:Be.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ie}},vertexShader:Be.backgroundCube_vert,fragmentShader:Be.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Be.cube_vert,fragmentShader:Be.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Be.equirect_vert,fragmentShader:Be.equirect_frag},distance:{uniforms:Pt([fe.common,fe.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Be.distance_vert,fragmentShader:Be.distance_frag},shadow:{uniforms:Pt([fe.lights,fe.fog,{color:{value:new We(0)},opacity:{value:1}}]),vertexShader:Be.shadow_vert,fragmentShader:Be.shadow_frag}};nn.physical={uniforms:Pt([nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ie},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ie},clearcoatNormalScale:{value:new qe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ie},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ie},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ie},sheen:{value:0},sheenColor:{value:new We(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ie},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ie},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ie},transmissionSamplerSize:{value:new qe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ie},attenuationDistance:{value:0},attenuationColor:{value:new We(0)},specularColor:{value:new We(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ie},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ie},anisotropyVector:{value:new qe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ie}}]),vertexShader:Be.meshphysical_vert,fragmentShader:Be.meshphysical_frag};const cs={r:0,b:0,g:0},Qd=new ut,Pl=new Ie;Pl.set(-1,0,0,0,1,0,0,0,1);function ef(i,e,t,n,s,r){const a=new We(0);let o=s===!0?0:1,u,h,p=null,m=0,d=null;function _(x){let y=x.isScene===!0?x.background:null;if(y&&y.isTexture){const T=x.backgroundBlurriness>0;y=e.get(y,T)}return y}function v(x){let y=!1;const T=_(x);T===null?f(a,o):T&&T.isColor&&(f(T,1),y=!0);const P=i.xr.getEnvironmentBlendMode();P==="additive"?t.buffers.color.setClear(0,0,0,1,r):P==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||y)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function S(x,y){const T=_(y);T&&(T.isCubeTexture||T.mapping===Cs)?(h===void 0&&(h=new ct(new Bt(1,1,1),new cn({name:"BackgroundCubeMaterial",uniforms:xi(nn.backgroundCube.uniforms),vertexShader:nn.backgroundCube.vertexShader,fragmentShader:nn.backgroundCube.fragmentShader,side:It,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(P,b,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(h)),h.material.uniforms.envMap.value=T,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Qd.makeRotationFromEuler(y.backgroundRotation)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&h.material.uniforms.backgroundRotation.value.premultiply(Pl),h.material.toneMapped=He.getTransfer(T.colorSpace)!==$e,(p!==T||m!==T.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,p=T,m=T.version,d=i.toneMapping),h.layers.enableAll(),x.unshift(h,h.geometry,h.material,0,0,null)):T&&T.isTexture&&(u===void 0&&(u=new ct(new Bi(2,2),new cn({name:"BackgroundMaterial",uniforms:xi(nn.background.uniforms),vertexShader:nn.background.vertexShader,fragmentShader:nn.background.fragmentShader,side:In,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(u)),u.material.uniforms.t2D.value=T,u.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,u.material.toneMapped=He.getTransfer(T.colorSpace)!==$e,T.matrixAutoUpdate===!0&&T.updateMatrix(),u.material.uniforms.uvTransform.value.copy(T.matrix),(p!==T||m!==T.version||d!==i.toneMapping)&&(u.material.needsUpdate=!0,p=T,m=T.version,d=i.toneMapping),u.layers.enableAll(),x.unshift(u,u.geometry,u.material,0,0,null))}function f(x,y){x.getRGB(cs,Al(i)),t.buffers.color.setClear(cs.r,cs.g,cs.b,y,r)}function l(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0)}return{getClearColor:function(){return a},setClearColor:function(x,y=1){a.set(x),o=y,f(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(x){o=x,f(a,o)},render:v,addToRenderList:S,dispose:l}}function tf(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,a=!1;function o(C,G,Z,$,B){let V=!1;const j=m(C,$,Z,G);r!==j&&(r=j,h(r.object)),V=_(C,$,Z,B),V&&v(C,$,Z,B),B!==null&&e.update(B,i.ELEMENT_ARRAY_BUFFER),(V||a)&&(a=!1,T(C,G,Z,$),B!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(B).buffer))}function u(){return i.createVertexArray()}function h(C){return i.bindVertexArray(C)}function p(C){return i.deleteVertexArray(C)}function m(C,G,Z,$){const B=$.wireframe===!0;let V=n[G.id];V===void 0&&(V={},n[G.id]=V);const j=C.isInstancedMesh===!0?C.id:0;let ne=V[j];ne===void 0&&(ne={},V[j]=ne);let ie=ne[Z.id];ie===void 0&&(ie={},ne[Z.id]=ie);let le=ie[B];return le===void 0&&(le=d(u()),ie[B]=le),le}function d(C){const G=[],Z=[],$=[];for(let B=0;B<t;B++)G[B]=0,Z[B]=0,$[B]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:G,enabledAttributes:Z,attributeDivisors:$,object:C,attributes:{},index:null}}function _(C,G,Z,$){const B=r.attributes,V=G.attributes;let j=0;const ne=Z.getAttributes();for(const ie in ne)if(ne[ie].location>=0){const ve=B[ie];let Te=V[ie];if(Te===void 0&&(ie==="instanceMatrix"&&C.instanceMatrix&&(Te=C.instanceMatrix),ie==="instanceColor"&&C.instanceColor&&(Te=C.instanceColor)),ve===void 0||ve.attribute!==Te||Te&&ve.data!==Te.data)return!0;j++}return r.attributesNum!==j||r.index!==$}function v(C,G,Z,$){const B={},V=G.attributes;let j=0;const ne=Z.getAttributes();for(const ie in ne)if(ne[ie].location>=0){let ve=V[ie];ve===void 0&&(ie==="instanceMatrix"&&C.instanceMatrix&&(ve=C.instanceMatrix),ie==="instanceColor"&&C.instanceColor&&(ve=C.instanceColor));const Te={};Te.attribute=ve,ve&&ve.data&&(Te.data=ve.data),B[ie]=Te,j++}r.attributes=B,r.attributesNum=j,r.index=$}function S(){const C=r.newAttributes;for(let G=0,Z=C.length;G<Z;G++)C[G]=0}function f(C){l(C,0)}function l(C,G){const Z=r.newAttributes,$=r.enabledAttributes,B=r.attributeDivisors;Z[C]=1,$[C]===0&&(i.enableVertexAttribArray(C),$[C]=1),B[C]!==G&&(i.vertexAttribDivisor(C,G),B[C]=G)}function x(){const C=r.newAttributes,G=r.enabledAttributes;for(let Z=0,$=G.length;Z<$;Z++)G[Z]!==C[Z]&&(i.disableVertexAttribArray(Z),G[Z]=0)}function y(C,G,Z,$,B,V,j){j===!0?i.vertexAttribIPointer(C,G,Z,B,V):i.vertexAttribPointer(C,G,Z,$,B,V)}function T(C,G,Z,$){S();const B=$.attributes,V=Z.getAttributes(),j=G.defaultAttributeValues;for(const ne in V){const ie=V[ne];if(ie.location>=0){let le=B[ne];if(le===void 0&&(ne==="instanceMatrix"&&C.instanceMatrix&&(le=C.instanceMatrix),ne==="instanceColor"&&C.instanceColor&&(le=C.instanceColor)),le!==void 0){const ve=le.normalized,Te=le.itemSize,Ve=e.get(le);if(Ve===void 0)continue;const Ke=Ve.buffer,De=Ve.type,J=Ve.bytesPerElement,he=De===i.INT||De===i.UNSIGNED_INT||le.gpuType===da;if(le.isInterleavedBufferAttribute){const ae=le.data,ye=ae.stride,Le=le.offset;if(ae.isInstancedInterleavedBuffer){for(let we=0;we<ie.locationSize;we++)l(ie.location+we,ae.meshPerAttribute);C.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let we=0;we<ie.locationSize;we++)f(ie.location+we);i.bindBuffer(i.ARRAY_BUFFER,Ke);for(let we=0;we<ie.locationSize;we++)y(ie.location+we,Te/ie.locationSize,De,ve,ye*J,(Le+Te/ie.locationSize*we)*J,he)}else{if(le.isInstancedBufferAttribute){for(let ae=0;ae<ie.locationSize;ae++)l(ie.location+ae,le.meshPerAttribute);C.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=le.meshPerAttribute*le.count)}else for(let ae=0;ae<ie.locationSize;ae++)f(ie.location+ae);i.bindBuffer(i.ARRAY_BUFFER,Ke);for(let ae=0;ae<ie.locationSize;ae++)y(ie.location+ae,Te/ie.locationSize,De,ve,Te*J,Te/ie.locationSize*ae*J,he)}}else if(j!==void 0){const ve=j[ne];if(ve!==void 0)switch(ve.length){case 2:i.vertexAttrib2fv(ie.location,ve);break;case 3:i.vertexAttrib3fv(ie.location,ve);break;case 4:i.vertexAttrib4fv(ie.location,ve);break;default:i.vertexAttrib1fv(ie.location,ve)}}}}x()}function P(){A();for(const C in n){const G=n[C];for(const Z in G){const $=G[Z];for(const B in $){const V=$[B];for(const j in V)p(V[j].object),delete V[j];delete $[B]}}delete n[C]}}function b(C){if(n[C.id]===void 0)return;const G=n[C.id];for(const Z in G){const $=G[Z];for(const B in $){const V=$[B];for(const j in V)p(V[j].object),delete V[j];delete $[B]}}delete n[C.id]}function I(C){for(const G in n){const Z=n[G];for(const $ in Z){const B=Z[$];if(B[C.id]===void 0)continue;const V=B[C.id];for(const j in V)p(V[j].object),delete V[j];delete B[C.id]}}}function g(C){for(const G in n){const Z=n[G],$=C.isInstancedMesh===!0?C.id:0,B=Z[$];if(B!==void 0){for(const V in B){const j=B[V];for(const ne in j)p(j[ne].object),delete j[ne];delete B[V]}delete Z[$],Object.keys(Z).length===0&&delete n[G]}}}function A(){L(),a=!0,r!==s&&(r=s,h(r.object))}function L(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:A,resetDefaultState:L,dispose:P,releaseStatesOfGeometry:b,releaseStatesOfObject:g,releaseStatesOfProgram:I,initAttributes:S,enableAttribute:f,disableUnusedAttributes:x}}function nf(i,e,t){let n;function s(u){n=u}function r(u,h){i.drawArrays(n,u,h),t.update(h,n,1)}function a(u,h,p){p!==0&&(i.drawArraysInstanced(n,u,h,p),t.update(h,n,p))}function o(u,h,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,u,0,h,0,p);let d=0;for(let _=0;_<p;_++)d+=h[_];t.update(d,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function sf(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){const I=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(I){return!(I!==Kt&&n.convert(I)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(I){const g=I===Mn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==zt&&n.convert(I)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&I!==sn&&!g)}function u(I){if(I==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let h=t.precision!==void 0?t.precision:"highp";const p=u(h);p!==h&&(Pe("WebGLRenderer:",h,"not supported, using",p,"instead."),h=p);const m=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&Pe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const _=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),f=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),l=i.getParameter(i.MAX_VERTEX_ATTRIBS),x=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),y=i.getParameter(i.MAX_VARYING_VECTORS),T=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),P=i.getParameter(i.MAX_SAMPLES),b=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:u,textureFormatReadable:a,textureTypeReadable:o,precision:h,logarithmicDepthBuffer:m,reversedDepthBuffer:d,maxTextures:_,maxVertexTextures:v,maxTextureSize:S,maxCubemapSize:f,maxAttributes:l,maxVertexUniforms:x,maxVaryings:y,maxFragmentUniforms:T,maxSamples:P,samples:b}}function rf(i){const e=this;let t=null,n=0,s=!1,r=!1;const a=new Gn,o=new Ie,u={value:null,needsUpdate:!1};this.uniform=u,this.numPlanes=0,this.numIntersection=0,this.init=function(m,d){const _=m.length!==0||d||n!==0||s;return s=d,n=m.length,_},this.beginShadows=function(){r=!0,p(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(m,d){t=p(m,d,0)},this.setState=function(m,d,_){const v=m.clippingPlanes,S=m.clipIntersection,f=m.clipShadows,l=i.get(m);if(!s||v===null||v.length===0||r&&!f)r?p(null):h();else{const x=r?0:n,y=x*4;let T=l.clippingState||null;u.value=T,T=p(v,d,y,_);for(let P=0;P!==y;++P)T[P]=t[P];l.clippingState=T,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=x}};function h(){u.value!==t&&(u.value=t,u.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function p(m,d,_,v){const S=m!==null?m.length:0;let f=null;if(S!==0){if(f=u.value,v!==!0||f===null){const l=_+S*4,x=d.matrixWorldInverse;o.getNormalMatrix(x),(f===null||f.length<l)&&(f=new Float32Array(l));for(let y=0,T=_;y!==S;++y,T+=4)a.copy(m[y]).applyMatrix4(x,o),a.normal.toArray(f,T),f[T+3]=a.constant}u.value=f,u.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,f}}const Dn=4,Ro=[.125,.215,.35,.446,.526,.582],Hn=20,af=256,Ri=new La,Co=new We;let hr=null,dr=0,fr=0,pr=!1;const of=new U;class Po{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){const{size:a=256,position:o=of}=r;hr=this._renderer.getRenderTarget(),dr=this._renderer.getActiveCubeFace(),fr=this._renderer.getActiveMipmapLevel(),pr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const u=this._allocateTargets();return u.depthBuffer=!0,this._sceneToCubeUV(e,n,s,u,o),t>0&&this._blur(u,0,0,t),this._applyPMREM(u),this._cleanup(u),u}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Io(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Do(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(hr,dr,fr),this._renderer.xr.enabled=pr,e.scissorTest=!1,ui(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===qn||e.mapping===_i?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),hr=this._renderer.getRenderTarget(),dr=this._renderer.getActiveCubeFace(),fr=this._renderer.getActiveMipmapLevel(),pr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Rt,minFilter:Rt,generateMipmaps:!1,type:Mn,format:Kt,colorSpace:ys,depthBuffer:!1},s=Lo(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Lo(e,t,n);const{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=lf(r)),this._blurMaterial=uf(r,e,t),this._ggxMaterial=cf(r,e,t)}return s}_compileMaterial(e){const t=new ct(new Tt,e);this._renderer.compile(t,Ri)}_sceneToCubeUV(e,t,n,s,r){const u=new kt(90,1,t,n),h=[1,-1,1,1,1,1],p=[1,1,1,-1,-1,-1],m=this._renderer,d=m.autoClear,_=m.toneMapping;m.getClearColor(Co),m.toneMapping=an,m.autoClear=!1,m.state.buffers.depth.getReversed()&&(m.setRenderTarget(s),m.clearDepth(),m.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ct(new Bt,new Ta({name:"PMREM.Background",side:It,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,f=S.material;let l=!1;const x=e.background;x?x.isColor&&(f.color.copy(x),e.background=null,l=!0):(f.color.copy(Co),l=!0);for(let y=0;y<6;y++){const T=y%3;T===0?(u.up.set(0,h[y],0),u.position.set(r.x,r.y,r.z),u.lookAt(r.x+p[y],r.y,r.z)):T===1?(u.up.set(0,0,h[y]),u.position.set(r.x,r.y,r.z),u.lookAt(r.x,r.y+p[y],r.z)):(u.up.set(0,h[y],0),u.position.set(r.x,r.y,r.z),u.lookAt(r.x,r.y,r.z+p[y]));const P=this._cubeSize;ui(s,T*P,y>2?P:0,P,P),m.setRenderTarget(s),l&&m.render(S,u),m.render(e,u)}m.toneMapping=_,m.autoClear=d,e.background=x}_textureToCubeUV(e,t){const n=this._renderer,s=e.mapping===qn||e.mapping===_i;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Io()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Do());const r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;const o=r.uniforms;o.envMap.value=e;const u=this._cubeSize;ui(t,0,0,3*u,2*u),n.setRenderTarget(t),n.render(a,Ri)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=n}_applyGGXFilter(e,t,n){const s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const u=a.uniforms,h=n/(this._lodMeshes.length-1),p=t/(this._lodMeshes.length-1),m=Math.sqrt(h*h-p*p),d=0+h*1.25,_=m*d,{_lodMax:v}=this,S=this._sizeLods[n],f=3*S*(n>v-Dn?n-v+Dn:0),l=4*(this._cubeSize-S);u.envMap.value=e.texture,u.roughness.value=_,u.mipInt.value=v-t,ui(r,f,l,3*S,2*S),s.setRenderTarget(r),s.render(o,Ri),u.envMap.value=r.texture,u.roughness.value=0,u.mipInt.value=v-n,ui(e,f,l,3*S,2*S),s.setRenderTarget(e),s.render(o,Ri)}_blur(e,t,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){const u=this._renderer,h=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Xe("blur direction must be either latitudinal or longitudinal!");const p=3,m=this._lodMeshes[s];m.material=h;const d=h.uniforms,_=this._sizeLods[n]-1,v=isFinite(r)?Math.PI/(2*_):2*Math.PI/(2*Hn-1),S=r/v,f=isFinite(r)?1+Math.floor(p*S):Hn;f>Hn&&Pe(`sigmaRadians, ${r}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Hn}`);const l=[];let x=0;for(let I=0;I<Hn;++I){const g=I/S,A=Math.exp(-g*g/2);l.push(A),I===0?x+=A:I<f&&(x+=2*A)}for(let I=0;I<l.length;I++)l[I]=l[I]/x;d.envMap.value=e.texture,d.samples.value=f,d.weights.value=l,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:y}=this;d.dTheta.value=v,d.mipInt.value=y-n;const T=this._sizeLods[s],P=3*T*(s>y-Dn?s-y+Dn:0),b=4*(this._cubeSize-T);ui(t,P,b,3*T,2*T),u.setRenderTarget(t),u.render(m,Ri)}}function lf(i){const e=[],t=[],n=[];let s=i;const r=i-Dn+1+Ro.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);e.push(o);let u=1/o;a>i-Dn?u=Ro[a-i+Dn-1]:a===0&&(u=0),t.push(u);const h=1/(o-2),p=-h,m=1+h,d=[p,p,m,p,m,m,p,p,m,m,p,m],_=6,v=6,S=3,f=2,l=1,x=new Float32Array(S*v*_),y=new Float32Array(f*v*_),T=new Float32Array(l*v*_);for(let b=0;b<_;b++){const I=b%3*2/3-1,g=b>2?0:-1,A=[I,g,0,I+2/3,g,0,I+2/3,g+1,0,I,g,0,I+2/3,g+1,0,I,g+1,0];x.set(A,S*v*b),y.set(d,f*v*b);const L=[b,b,b,b,b,b];T.set(L,l*v*b)}const P=new Tt;P.setAttribute("position",new Wt(x,S)),P.setAttribute("uv",new Wt(y,f)),P.setAttribute("faceIndex",new Wt(T,l)),n.push(new ct(P,null)),s>Dn&&s--}return{lodMeshes:n,sizeLods:e,sigmas:t}}function Lo(i,e,t){const n=new on(i,e,t);return n.texture.mapping=Cs,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ui(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function cf(i,e,t){return new cn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:af,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ls(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:xn,depthTest:!1,depthWrite:!1})}function uf(i,e,t){const n=new Float32Array(Hn),s=new U(0,1,0);return new cn({name:"SphericalGaussianBlur",defines:{n:Hn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Ls(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:xn,depthTest:!1,depthWrite:!1})}function Do(){return new cn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ls(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:xn,depthTest:!1,depthWrite:!1})}function Io(){return new cn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ls(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:xn,depthTest:!1,depthWrite:!1})}function Ls(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class Ll extends on{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Tl(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Bt(5,5,5),r=new cn({name:"CubemapFromEquirect",uniforms:xi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:It,blending:xn});r.uniforms.tEquirect.value=t;const a=new ct(s,r),o=t.minFilter;return t.minFilter===kn&&(t.minFilter=Rt),new du(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}}function hf(i){let e=new WeakMap,t=new WeakMap,n=null;function s(d,_=!1){return d==null?null:_?a(d):r(d)}function r(d){if(d&&d.isTexture){const _=d.mapping;if(_===Fs||_===Os)if(e.has(d)){const v=e.get(d).texture;return o(v,d.mapping)}else{const v=d.image;if(v&&v.height>0){const S=new Ll(v.height);return S.fromEquirectangularTexture(i,d),e.set(d,S),d.addEventListener("dispose",h),o(S.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){const _=d.mapping,v=_===Fs||_===Os,S=_===qn||_===_i;if(v||S){let f=t.get(d);const l=f!==void 0?f.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==l)return n===null&&(n=new Po(i)),f=v?n.fromEquirectangular(d,f):n.fromCubemap(d,f),f.texture.pmremVersion=d.pmremVersion,t.set(d,f),f.texture;if(f!==void 0)return f.texture;{const x=d.image;return v&&x&&x.height>0||S&&x&&u(x)?(n===null&&(n=new Po(i)),f=v?n.fromEquirectangular(d):n.fromCubemap(d),f.texture.pmremVersion=d.pmremVersion,t.set(d,f),d.addEventListener("dispose",p),f.texture):null}}}return d}function o(d,_){return _===Fs?d.mapping=qn:_===Os&&(d.mapping=_i),d}function u(d){let _=0;const v=6;for(let S=0;S<v;S++)d[S]!==void 0&&_++;return _===v}function h(d){const _=d.target;_.removeEventListener("dispose",h);const v=e.get(_);v!==void 0&&(e.delete(_),v.dispose())}function p(d){const _=d.target;_.removeEventListener("dispose",p);const v=t.get(_);v!==void 0&&(t.delete(_),v.dispose())}function m(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:m}}function df(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const s=t(n);return s===null&&aa("WebGLRenderer: "+n+" extension not supported."),s}}}function ff(i,e,t,n){const s={},r=new WeakMap;function a(m){const d=m.target;d.index!==null&&e.remove(d.index);for(const v in d.attributes)e.remove(d.attributes[v]);d.removeEventListener("dispose",a),delete s[d.id];const _=r.get(d);_&&(e.remove(_),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(m,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function u(m){const d=m.attributes;for(const _ in d)e.update(d[_],i.ARRAY_BUFFER)}function h(m){const d=[],_=m.index,v=m.attributes.position;let S=0;if(v===void 0)return;if(_!==null){const x=_.array;S=_.version;for(let y=0,T=x.length;y<T;y+=3){const P=x[y+0],b=x[y+1],I=x[y+2];d.push(P,b,b,I,I,P)}}else{const x=v.array;S=v.version;for(let y=0,T=x.length/3-1;y<T;y+=3){const P=y+0,b=y+1,I=y+2;d.push(P,b,b,I,I,P)}}const f=new(v.count>=65535?El:Sl)(d,1);f.version=S;const l=r.get(m);l&&e.remove(l),r.set(m,f)}function p(m){const d=r.get(m);if(d){const _=m.index;_!==null&&d.version<_.version&&h(m)}else h(m);return r.get(m)}return{get:o,update:u,getWireframeAttribute:p}}function pf(i,e,t){let n;function s(m){n=m}let r,a;function o(m){r=m.type,a=m.bytesPerElement}function u(m,d){i.drawElements(n,d,r,m*a),t.update(d,n,1)}function h(m,d,_){_!==0&&(i.drawElementsInstanced(n,d,r,m*a,_),t.update(d,n,_))}function p(m,d,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,m,0,_);let S=0;for(let f=0;f<_;f++)S+=d[f];t.update(S,n,1)}this.setMode=s,this.setIndex=o,this.render=u,this.renderInstances=h,this.renderMultiDraw=p}function mf(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Xe("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function _f(i,e,t){const n=new WeakMap,s=new dt;function r(a,o,u){const h=a.morphTargetInfluences,p=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,m=p!==void 0?p.length:0;let d=n.get(o);if(d===void 0||d.count!==m){let A=function(){I.dispose(),n.delete(o),o.removeEventListener("dispose",A)};d!==void 0&&d.texture.dispose();const _=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],l=o.morphAttributes.normal||[],x=o.morphAttributes.color||[];let y=0;_===!0&&(y=1),v===!0&&(y=2),S===!0&&(y=3);let T=o.attributes.position.count*y,P=1;T>e.maxTextureSize&&(P=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const b=new Float32Array(T*P*4*m),I=new vl(b,T,P,m);I.type=sn,I.needsUpdate=!0;const g=y*4;for(let L=0;L<m;L++){const C=f[L],G=l[L],Z=x[L],$=T*P*4*L;for(let B=0;B<C.count;B++){const V=B*g;_===!0&&(s.fromBufferAttribute(C,B),b[$+V+0]=s.x,b[$+V+1]=s.y,b[$+V+2]=s.z,b[$+V+3]=0),v===!0&&(s.fromBufferAttribute(G,B),b[$+V+4]=s.x,b[$+V+5]=s.y,b[$+V+6]=s.z,b[$+V+7]=0),S===!0&&(s.fromBufferAttribute(Z,B),b[$+V+8]=s.x,b[$+V+9]=s.y,b[$+V+10]=s.z,b[$+V+11]=Z.itemSize===4?s.w:1)}}d={count:m,texture:I,size:new qe(T,P)},n.set(o,d),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)u.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let _=0;for(let S=0;S<h.length;S++)_+=h[S];const v=o.morphTargetsRelative?1:1-_;u.getUniforms().setValue(i,"morphTargetBaseInfluence",v),u.getUniforms().setValue(i,"morphTargetInfluences",h)}u.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),u.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function gf(i,e,t,n,s){let r=new WeakMap;function a(h){const p=s.render.frame,m=h.geometry,d=e.get(h,m);if(r.get(d)!==p&&(e.update(d),r.set(d,p)),h.isInstancedMesh&&(h.hasEventListener("dispose",u)===!1&&h.addEventListener("dispose",u),r.get(h)!==p&&(t.update(h.instanceMatrix,i.ARRAY_BUFFER),h.instanceColor!==null&&t.update(h.instanceColor,i.ARRAY_BUFFER),r.set(h,p))),h.isSkinnedMesh){const _=h.skeleton;r.get(_)!==p&&(_.update(),r.set(_,p))}return d}function o(){r=new WeakMap}function u(h){const p=h.target;p.removeEventListener("dispose",u),n.releaseStatesOfObject(p),t.remove(p.instanceMatrix),p.instanceColor!==null&&t.remove(p.instanceColor)}return{update:a,dispose:o}}const xf={[il]:"LINEAR_TONE_MAPPING",[sl]:"REINHARD_TONE_MAPPING",[rl]:"CINEON_TONE_MAPPING",[al]:"ACES_FILMIC_TONE_MAPPING",[ll]:"AGX_TONE_MAPPING",[cl]:"NEUTRAL_TONE_MAPPING",[ol]:"CUSTOM_TONE_MAPPING"};function vf(i,e,t,n,s){const r=new on(e,t,{type:i,depthBuffer:n,stencilBuffer:s,depthTexture:n?new gi(e,t):void 0}),a=new on(e,t,{type:Mn,depthBuffer:!1,stencilBuffer:!1}),o=new Tt;o.setAttribute("position",new lt([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new lt([0,2,0,0,2,0],2));const u=new ru({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new ct(o,u),p=new La(-1,1,1,-1,0,1);let m=null,d=null,_=!1,v,S=null,f=[],l=!1;this.setSize=function(x,y){r.setSize(x,y),a.setSize(x,y);for(let T=0;T<f.length;T++){const P=f[T];P.setSize&&P.setSize(x,y)}},this.setEffects=function(x){f=x,l=f.length>0&&f[0].isRenderPass===!0;const y=r.width,T=r.height;for(let P=0;P<f.length;P++){const b=f[P];b.setSize&&b.setSize(y,T)}},this.begin=function(x,y){if(_||x.toneMapping===an&&f.length===0)return!1;if(S=y,y!==null){const T=y.width,P=y.height;(r.width!==T||r.height!==P)&&this.setSize(T,P)}return l===!1&&x.setRenderTarget(r),v=x.toneMapping,x.toneMapping=an,!0},this.hasRenderPass=function(){return l},this.end=function(x,y){x.toneMapping=v,_=!0;let T=r,P=a;for(let b=0;b<f.length;b++){const I=f[b];if(I.enabled!==!1&&(I.render(x,P,T,y),I.needsSwap!==!1)){const g=T;T=P,P=g}}if(m!==x.outputColorSpace||d!==x.toneMapping){m=x.outputColorSpace,d=x.toneMapping,u.defines={},He.getTransfer(m)===$e&&(u.defines.SRGB_TRANSFER="");const b=xf[d];b&&(u.defines[b]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=T.texture,x.setRenderTarget(S),x.render(h,p),S=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){r.depthTexture&&r.depthTexture.dispose(),r.dispose(),a.dispose(),o.dispose(),u.dispose()}}const Dl=new Lt,ca=new gi(1,1),Il=new vl,Ul=new Nc,Nl=new Tl,Uo=[],No=[],Fo=new Float32Array(16),Oo=new Float32Array(9),Bo=new Float32Array(4);function Si(i,e,t){const n=i[0];if(n<=0||n>0)return i;const s=e*t;let r=Uo[s];if(r===void 0&&(r=new Float32Array(s),Uo[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function xt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function vt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Ds(i,e){let t=No[e];t===void 0&&(t=new Int32Array(e),No[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Mf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Sf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(xt(t,e))return;i.uniform2fv(this.addr,e),vt(t,e)}}function Ef(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(xt(t,e))return;i.uniform3fv(this.addr,e),vt(t,e)}}function yf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(xt(t,e))return;i.uniform4fv(this.addr,e),vt(t,e)}}function Tf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(xt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),vt(t,e)}else{if(xt(t,n))return;Bo.set(n),i.uniformMatrix2fv(this.addr,!1,Bo),vt(t,n)}}function bf(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(xt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),vt(t,e)}else{if(xt(t,n))return;Oo.set(n),i.uniformMatrix3fv(this.addr,!1,Oo),vt(t,n)}}function Af(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(xt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),vt(t,e)}else{if(xt(t,n))return;Fo.set(n),i.uniformMatrix4fv(this.addr,!1,Fo),vt(t,n)}}function wf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Rf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(xt(t,e))return;i.uniform2iv(this.addr,e),vt(t,e)}}function Cf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(xt(t,e))return;i.uniform3iv(this.addr,e),vt(t,e)}}function Pf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(xt(t,e))return;i.uniform4iv(this.addr,e),vt(t,e)}}function Lf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Df(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(xt(t,e))return;i.uniform2uiv(this.addr,e),vt(t,e)}}function If(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(xt(t,e))return;i.uniform3uiv(this.addr,e),vt(t,e)}}function Uf(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(xt(t,e))return;i.uniform4uiv(this.addr,e),vt(t,e)}}function Nf(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(ca.compareFunction=t.isReversedDepthBuffer()?va:xa,r=ca):r=Dl,t.setTexture2D(e||r,s)}function Ff(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Ul,s)}function Of(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||Nl,s)}function Bf(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Il,s)}function zf(i){switch(i){case 5126:return Mf;case 35664:return Sf;case 35665:return Ef;case 35666:return yf;case 35674:return Tf;case 35675:return bf;case 35676:return Af;case 5124:case 35670:return wf;case 35667:case 35671:return Rf;case 35668:case 35672:return Cf;case 35669:case 35673:return Pf;case 5125:return Lf;case 36294:return Df;case 36295:return If;case 36296:return Uf;case 35678:case 36198:case 36298:case 36306:case 35682:return Nf;case 35679:case 36299:case 36307:return Ff;case 35680:case 36300:case 36308:case 36293:return Of;case 36289:case 36303:case 36311:case 36292:return Bf}}function Gf(i,e){i.uniform1fv(this.addr,e)}function Vf(i,e){const t=Si(e,this.size,2);i.uniform2fv(this.addr,t)}function Hf(i,e){const t=Si(e,this.size,3);i.uniform3fv(this.addr,t)}function kf(i,e){const t=Si(e,this.size,4);i.uniform4fv(this.addr,t)}function Wf(i,e){const t=Si(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Xf(i,e){const t=Si(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function qf(i,e){const t=Si(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Yf(i,e){i.uniform1iv(this.addr,e)}function jf(i,e){i.uniform2iv(this.addr,e)}function Kf(i,e){i.uniform3iv(this.addr,e)}function Zf(i,e){i.uniform4iv(this.addr,e)}function $f(i,e){i.uniform1uiv(this.addr,e)}function Jf(i,e){i.uniform2uiv(this.addr,e)}function Qf(i,e){i.uniform3uiv(this.addr,e)}function ep(i,e){i.uniform4uiv(this.addr,e)}function tp(i,e,t){const n=this.cache,s=e.length,r=Ds(t,s);xt(n,r)||(i.uniform1iv(this.addr,r),vt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=ca:a=Dl;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function np(i,e,t){const n=this.cache,s=e.length,r=Ds(t,s);xt(n,r)||(i.uniform1iv(this.addr,r),vt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Ul,r[a])}function ip(i,e,t){const n=this.cache,s=e.length,r=Ds(t,s);xt(n,r)||(i.uniform1iv(this.addr,r),vt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Nl,r[a])}function sp(i,e,t){const n=this.cache,s=e.length,r=Ds(t,s);xt(n,r)||(i.uniform1iv(this.addr,r),vt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Il,r[a])}function rp(i){switch(i){case 5126:return Gf;case 35664:return Vf;case 35665:return Hf;case 35666:return kf;case 35674:return Wf;case 35675:return Xf;case 35676:return qf;case 5124:case 35670:return Yf;case 35667:case 35671:return jf;case 35668:case 35672:return Kf;case 35669:case 35673:return Zf;case 5125:return $f;case 36294:return Jf;case 36295:return Qf;case 36296:return ep;case 35678:case 36198:case 36298:case 36306:case 35682:return tp;case 35679:case 36299:case 36307:return np;case 35680:case 36300:case 36308:case 36293:return ip;case 36289:case 36303:case 36311:case 36292:return sp}}class ap{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=zf(t.type)}}class op{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=rp(t.type)}}class lp{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(e,t[o.id],n)}}}const mr=/(\w+)(\])?(\[|\.)?/g;function zo(i,e){i.seq.push(e),i.map[e.id]=e}function cp(i,e,t){const n=i.name,s=n.length;for(mr.lastIndex=0;;){const r=mr.exec(n),a=mr.lastIndex;let o=r[1];const u=r[2]==="]",h=r[3];if(u&&(o=o|0),h===void 0||h==="["&&a+2===s){zo(t,h===void 0?new ap(o,i,e):new op(o,i,e));break}else{let m=t.map[o];m===void 0&&(m=new lp(o),zo(t,m)),t=m}}}class Ms{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),u=e.getUniformLocation(t,o.name);cp(o,u,this)}const s=[],r=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){const r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){const o=t[r],u=n[o.id];u.needsUpdate!==!1&&o.setValue(e,u.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,r=e.length;s!==r;++s){const a=e[s];a.id in t&&n.push(a)}return n}}function Go(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const up=37297;let hp=0;function dp(i,e){const t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const Vo=new Ie;function fp(i){He._getMatrix(Vo,He.workingColorSpace,i);const e=`mat3( ${Vo.elements.map(t=>t.toFixed(4))} )`;switch(He.getTransfer(i)){case Ts:return[e,"LinearTransferOETF"];case $e:return[e,"sRGBTransferOETF"];default:return Pe("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Ho(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+dp(i.getShaderSource(e),o)}else return r}function pp(i,e){const t=fp(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const mp={[il]:"Linear",[sl]:"Reinhard",[rl]:"Cineon",[al]:"ACESFilmic",[ll]:"AgX",[cl]:"Neutral",[ol]:"Custom"};function _p(i,e){const t=mp[e];return t===void 0?(Pe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const us=new U;function gp(){He.getLuminanceCoefficients(us);const i=us.x.toFixed(4),e=us.y.toFixed(4),t=us.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function xp(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Li).join(`
`)}function vp(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Mp(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(e,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Li(i){return i!==""}function ko(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Wo(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Sp=/^[ \t]*#include +<([\w\d./]+)>/gm;function ua(i){return i.replace(Sp,yp)}const Ep=new Map;function yp(i,e){let t=Be[e];if(t===void 0){const n=Ep.get(e);if(n!==void 0)t=Be[n],Pe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return ua(t)}const Tp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Xo(i){return i.replace(Tp,bp)}function bp(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function qo(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Ap={[ms]:"SHADOWMAP_TYPE_PCF",[Pi]:"SHADOWMAP_TYPE_VSM"};function wp(i){return Ap[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Rp={[qn]:"ENVMAP_TYPE_CUBE",[_i]:"ENVMAP_TYPE_CUBE",[Cs]:"ENVMAP_TYPE_CUBE_UV"};function Cp(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Rp[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const Pp={[_i]:"ENVMAP_MODE_REFRACTION"};function Lp(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Pp[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Dp={[nl]:"ENVMAP_BLENDING_MULTIPLY",[pc]:"ENVMAP_BLENDING_MIX",[mc]:"ENVMAP_BLENDING_ADD"};function Ip(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Dp[i.combine]||"ENVMAP_BLENDING_NONE"}function Up(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function Np(i,e,t,n){const s=i.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const u=wp(t),h=Cp(t),p=Lp(t),m=Ip(t),d=Up(t),_=xp(t),v=vp(r),S=s.createProgram();let f,l,x=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(Li).join(`
`),f.length>0&&(f+=`
`),l=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter(Li).join(`
`),l.length>0&&(l+=`
`)):(f=[qo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+p:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+u:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Li).join(`
`),l=[qo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.envMap?"#define "+p:"",t.envMap?"#define "+m:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+u:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==an?"#define TONE_MAPPING":"",t.toneMapping!==an?Be.tonemapping_pars_fragment:"",t.toneMapping!==an?_p("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Be.colorspace_pars_fragment,pp("linearToOutputTexel",t.outputColorSpace),gp(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Li).join(`
`)),a=ua(a),a=ko(a,t),a=Wo(a,t),o=ua(o),o=ko(o,t),o=Wo(o,t),a=Xo(a),o=Xo(o),t.isRawShaderMaterial!==!0&&(x=`#version 300 es
`,f=[_,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,l=["#define varying in",t.glslVersion===$a?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===$a?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+l);const y=x+f+a,T=x+l+o,P=Go(s,s.VERTEX_SHADER,y),b=Go(s,s.FRAGMENT_SHADER,T);s.attachShader(S,P),s.attachShader(S,b),t.index0AttributeName!==void 0?s.bindAttribLocation(S,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function I(C){if(i.debug.checkShaderErrors){const G=s.getProgramInfoLog(S)||"",Z=s.getShaderInfoLog(P)||"",$=s.getShaderInfoLog(b)||"",B=G.trim(),V=Z.trim(),j=$.trim();let ne=!0,ie=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(ne=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,S,P,b);else{const le=Ho(s,P,"vertex"),ve=Ho(s,b,"fragment");Xe("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+B+`
`+le+`
`+ve)}else B!==""?Pe("WebGLProgram: Program Info Log:",B):(V===""||j==="")&&(ie=!1);ie&&(C.diagnostics={runnable:ne,programLog:B,vertexShader:{log:V,prefix:f},fragmentShader:{log:j,prefix:l}})}s.deleteShader(P),s.deleteShader(b),g=new Ms(s,S),A=Mp(s,S)}let g;this.getUniforms=function(){return g===void 0&&I(this),g};let A;this.getAttributes=function(){return A===void 0&&I(this),A};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=s.getProgramParameter(S,up)),L},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=hp++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=P,this.fragmentShader=b,this}let Fp=0;class Op{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Bp(e),t.set(e,n)),n}}class Bp{constructor(e){this.id=Fp++,this.code=e,this.usedTimes=0}}function zp(i){return i===Yn||i===Ss||i===Es}function Gp(i,e,t,n,s,r){const a=new Sa,o=new Op,u=new Set,h=[],p=new Map,m=n.logarithmicDepthBuffer;let d=n.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(g){return u.add(g),g===0?"uv":`uv${g}`}function S(g,A,L,C,G,Z){const $=C.fog,B=G.geometry,V=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?C.environment:null,j=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap,ne=e.get(g.envMap||V,j),ie=ne&&ne.mapping===Cs?ne.image.height:null,le=_[g.type];g.precision!==null&&(d=n.getMaxPrecision(g.precision),d!==g.precision&&Pe("WebGLProgram.getParameters:",g.precision,"not supported, using",d,"instead."));const ve=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Te=ve!==void 0?ve.length:0;let Ve=0;B.morphAttributes.position!==void 0&&(Ve=1),B.morphAttributes.normal!==void 0&&(Ve=2),B.morphAttributes.color!==void 0&&(Ve=3);let Ke,De,J,he;if(le){const Ne=nn[le];Ke=Ne.vertexShader,De=Ne.fragmentShader}else Ke=g.vertexShader,De=g.fragmentShader,o.update(g),J=o.getVertexShaderID(g),he=o.getFragmentShaderID(g);const ae=i.getRenderTarget(),ye=i.state.buffers.depth.getReversed(),Le=G.isInstancedMesh===!0,we=G.isBatchedMesh===!0,st=!!g.map,ze=!!g.matcap,je=!!ne,Ze=!!g.aoMap,Ue=!!g.lightMap,tt=!!g.bumpMap,ot=!!g.normalMap,Ct=!!g.displacementMap,N=!!g.emissiveMap,ft=!!g.metalnessMap,Oe=!!g.roughnessMap,Je=g.anisotropy>0,ce=g.clearcoat>0,rt=g.dispersion>0,E=g.iridescence>0,c=g.sheen>0,w=g.transmission>0,D=Je&&!!g.anisotropyMap,k=ce&&!!g.clearcoatMap,F=ce&&!!g.clearcoatNormalMap,H=ce&&!!g.clearcoatRoughnessMap,z=E&&!!g.iridescenceMap,q=E&&!!g.iridescenceThicknessMap,Q=c&&!!g.sheenColorMap,ue=c&&!!g.sheenRoughnessMap,se=!!g.specularMap,re=!!g.specularColorMap,Ce=!!g.specularIntensityMap,de=w&&!!g.transmissionMap,Re=w&&!!g.thicknessMap,R=!!g.gradientMap,te=!!g.alphaMap,K=g.alphaTest>0,me=!!g.alphaHash,oe=!!g.extensions;let ee=an;g.toneMapped&&(ae===null||ae.isXRRenderTarget===!0)&&(ee=i.toneMapping);const Me={shaderID:le,shaderType:g.type,shaderName:g.name,vertexShader:Ke,fragmentShader:De,defines:g.defines,customVertexShaderID:J,customFragmentShaderID:he,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:d,batching:we,batchingColor:we&&G._colorsTexture!==null,instancing:Le,instancingColor:Le&&G.instanceColor!==null,instancingMorph:Le&&G.morphTexture!==null,outputColorSpace:ae===null?i.outputColorSpace:ae.isXRRenderTarget===!0?ae.texture.colorSpace:He.workingColorSpace,alphaToCoverage:!!g.alphaToCoverage,map:st,matcap:ze,envMap:je,envMapMode:je&&ne.mapping,envMapCubeUVHeight:ie,aoMap:Ze,lightMap:Ue,bumpMap:tt,normalMap:ot,displacementMap:Ct,emissiveMap:N,normalMapObjectSpace:ot&&g.normalMapType===xc,normalMapTangentSpace:ot&&g.normalMapType===ra,packedNormalMap:ot&&g.normalMapType===ra&&zp(g.normalMap.format),metalnessMap:ft,roughnessMap:Oe,anisotropy:Je,anisotropyMap:D,clearcoat:ce,clearcoatMap:k,clearcoatNormalMap:F,clearcoatRoughnessMap:H,dispersion:rt,iridescence:E,iridescenceMap:z,iridescenceThicknessMap:q,sheen:c,sheenColorMap:Q,sheenRoughnessMap:ue,specularMap:se,specularColorMap:re,specularIntensityMap:Ce,transmission:w,transmissionMap:de,thicknessMap:Re,gradientMap:R,opaque:g.transparent===!1&&g.blending===fi&&g.alphaToCoverage===!1,alphaMap:te,alphaTest:K,alphaHash:me,combine:g.combine,mapUv:st&&v(g.map.channel),aoMapUv:Ze&&v(g.aoMap.channel),lightMapUv:Ue&&v(g.lightMap.channel),bumpMapUv:tt&&v(g.bumpMap.channel),normalMapUv:ot&&v(g.normalMap.channel),displacementMapUv:Ct&&v(g.displacementMap.channel),emissiveMapUv:N&&v(g.emissiveMap.channel),metalnessMapUv:ft&&v(g.metalnessMap.channel),roughnessMapUv:Oe&&v(g.roughnessMap.channel),anisotropyMapUv:D&&v(g.anisotropyMap.channel),clearcoatMapUv:k&&v(g.clearcoatMap.channel),clearcoatNormalMapUv:F&&v(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:H&&v(g.clearcoatRoughnessMap.channel),iridescenceMapUv:z&&v(g.iridescenceMap.channel),iridescenceThicknessMapUv:q&&v(g.iridescenceThicknessMap.channel),sheenColorMapUv:Q&&v(g.sheenColorMap.channel),sheenRoughnessMapUv:ue&&v(g.sheenRoughnessMap.channel),specularMapUv:se&&v(g.specularMap.channel),specularColorMapUv:re&&v(g.specularColorMap.channel),specularIntensityMapUv:Ce&&v(g.specularIntensityMap.channel),transmissionMapUv:de&&v(g.transmissionMap.channel),thicknessMapUv:Re&&v(g.thicknessMap.channel),alphaMapUv:te&&v(g.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(ot||Je),vertexNormals:!!B.attributes.normal,vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:G.isPoints===!0&&!!B.attributes.uv&&(st||te),fog:!!$,useFog:g.fog===!0,fogExp2:!!$&&$.isFogExp2,flatShading:g.wireframe===!1&&(g.flatShading===!0||B.attributes.normal===void 0&&ot===!1&&(g.isMeshLambertMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isMeshPhysicalMaterial)),sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:m,reversedDepthBuffer:ye,skinning:G.isSkinnedMesh===!0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:Te,morphTextureStride:Ve,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:Z.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:g.dithering,shadowMapEnabled:i.shadowMap.enabled&&L.length>0,shadowMapType:i.shadowMap.type,toneMapping:ee,decodeVideoTexture:st&&g.map.isVideoTexture===!0&&He.getTransfer(g.map.colorSpace)===$e,decodeVideoTextureEmissive:N&&g.emissiveMap.isVideoTexture===!0&&He.getTransfer(g.emissiveMap.colorSpace)===$e,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===_n,flipSided:g.side===It,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:oe&&g.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(oe&&g.extensions.multiDraw===!0||we)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return Me.vertexUv1s=u.has(1),Me.vertexUv2s=u.has(2),Me.vertexUv3s=u.has(3),u.clear(),Me}function f(g){const A=[];if(g.shaderID?A.push(g.shaderID):(A.push(g.customVertexShaderID),A.push(g.customFragmentShaderID)),g.defines!==void 0)for(const L in g.defines)A.push(L),A.push(g.defines[L]);return g.isRawShaderMaterial===!1&&(l(A,g),x(A,g),A.push(i.outputColorSpace)),A.push(g.customProgramCacheKey),A.join()}function l(g,A){g.push(A.precision),g.push(A.outputColorSpace),g.push(A.envMapMode),g.push(A.envMapCubeUVHeight),g.push(A.mapUv),g.push(A.alphaMapUv),g.push(A.lightMapUv),g.push(A.aoMapUv),g.push(A.bumpMapUv),g.push(A.normalMapUv),g.push(A.displacementMapUv),g.push(A.emissiveMapUv),g.push(A.metalnessMapUv),g.push(A.roughnessMapUv),g.push(A.anisotropyMapUv),g.push(A.clearcoatMapUv),g.push(A.clearcoatNormalMapUv),g.push(A.clearcoatRoughnessMapUv),g.push(A.iridescenceMapUv),g.push(A.iridescenceThicknessMapUv),g.push(A.sheenColorMapUv),g.push(A.sheenRoughnessMapUv),g.push(A.specularMapUv),g.push(A.specularColorMapUv),g.push(A.specularIntensityMapUv),g.push(A.transmissionMapUv),g.push(A.thicknessMapUv),g.push(A.combine),g.push(A.fogExp2),g.push(A.sizeAttenuation),g.push(A.morphTargetsCount),g.push(A.morphAttributeCount),g.push(A.numDirLights),g.push(A.numPointLights),g.push(A.numSpotLights),g.push(A.numSpotLightMaps),g.push(A.numHemiLights),g.push(A.numRectAreaLights),g.push(A.numDirLightShadows),g.push(A.numPointLightShadows),g.push(A.numSpotLightShadows),g.push(A.numSpotLightShadowsWithMaps),g.push(A.numLightProbes),g.push(A.shadowMapType),g.push(A.toneMapping),g.push(A.numClippingPlanes),g.push(A.numClipIntersection),g.push(A.depthPacking)}function x(g,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),g.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),g.push(a.mask)}function y(g){const A=_[g.type];let L;if(A){const C=nn[A];L=nu.clone(C.uniforms)}else L=g.uniforms;return L}function T(g,A){let L=p.get(A);return L!==void 0?++L.usedTimes:(L=new Np(i,A,g,s),h.push(L),p.set(A,L)),L}function P(g){if(--g.usedTimes===0){const A=h.indexOf(g);h[A]=h[h.length-1],h.pop(),p.delete(g.cacheKey),g.destroy()}}function b(g){o.remove(g)}function I(){o.dispose()}return{getParameters:S,getProgramCacheKey:f,getUniforms:y,acquireProgram:T,releaseProgram:P,releaseShaderCache:b,programs:h,dispose:I}}function Vp(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,u){i.get(a)[o]=u}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function Hp(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function Yo(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function jo(){const i=[];let e=0;const t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(d){let _=0;return d.isInstancedMesh&&(_+=2),d.isSkinnedMesh&&(_+=1),_}function o(d,_,v,S,f,l){let x=i[e];return x===void 0?(x={id:d.id,object:d,geometry:_,material:v,materialVariant:a(d),groupOrder:S,renderOrder:d.renderOrder,z:f,group:l},i[e]=x):(x.id=d.id,x.object=d,x.geometry=_,x.material=v,x.materialVariant=a(d),x.groupOrder=S,x.renderOrder=d.renderOrder,x.z=f,x.group=l),e++,x}function u(d,_,v,S,f,l){const x=o(d,_,v,S,f,l);v.transmission>0?n.push(x):v.transparent===!0?s.push(x):t.push(x)}function h(d,_,v,S,f,l){const x=o(d,_,v,S,f,l);v.transmission>0?n.unshift(x):v.transparent===!0?s.unshift(x):t.unshift(x)}function p(d,_){t.length>1&&t.sort(d||Hp),n.length>1&&n.sort(_||Yo),s.length>1&&s.sort(_||Yo)}function m(){for(let d=e,_=i.length;d<_;d++){const v=i[d];if(v.id===null)break;v.id=null,v.object=null,v.geometry=null,v.material=null,v.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:u,unshift:h,finish:m,sort:p}}function kp(){let i=new WeakMap;function e(n,s){const r=i.get(n);let a;return r===void 0?(a=new jo,i.set(n,[a])):s>=r.length?(a=new jo,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function Wp(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new U,color:new We};break;case"SpotLight":t={position:new U,direction:new U,color:new We,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new U,color:new We,distance:0,decay:0};break;case"HemisphereLight":t={direction:new U,skyColor:new We,groundColor:new We};break;case"RectAreaLight":t={color:new We,position:new U,halfWidth:new U,halfHeight:new U};break}return i[e.id]=t,t}}}function Xp(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qe,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let qp=0;function Yp(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function jp(i){const e=new Wp,t=Xp(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)n.probe.push(new U);const s=new U,r=new ut,a=new ut;function o(h){let p=0,m=0,d=0;for(let A=0;A<9;A++)n.probe[A].set(0,0,0);let _=0,v=0,S=0,f=0,l=0,x=0,y=0,T=0,P=0,b=0,I=0;h.sort(Yp);for(let A=0,L=h.length;A<L;A++){const C=h[A],G=C.color,Z=C.intensity,$=C.distance;let B=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===Yn?B=C.shadow.map.texture:B=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)p+=G.r*Z,m+=G.g*Z,d+=G.b*Z;else if(C.isLightProbe){for(let V=0;V<9;V++)n.probe[V].addScaledVector(C.sh.coefficients[V],Z);I++}else if(C.isDirectionalLight){const V=e.get(C);if(V.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const j=C.shadow,ne=t.get(C);ne.shadowIntensity=j.intensity,ne.shadowBias=j.bias,ne.shadowNormalBias=j.normalBias,ne.shadowRadius=j.radius,ne.shadowMapSize=j.mapSize,n.directionalShadow[_]=ne,n.directionalShadowMap[_]=B,n.directionalShadowMatrix[_]=C.shadow.matrix,x++}n.directional[_]=V,_++}else if(C.isSpotLight){const V=e.get(C);V.position.setFromMatrixPosition(C.matrixWorld),V.color.copy(G).multiplyScalar(Z),V.distance=$,V.coneCos=Math.cos(C.angle),V.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),V.decay=C.decay,n.spot[S]=V;const j=C.shadow;if(C.map&&(n.spotLightMap[P]=C.map,P++,j.updateMatrices(C),C.castShadow&&b++),n.spotLightMatrix[S]=j.matrix,C.castShadow){const ne=t.get(C);ne.shadowIntensity=j.intensity,ne.shadowBias=j.bias,ne.shadowNormalBias=j.normalBias,ne.shadowRadius=j.radius,ne.shadowMapSize=j.mapSize,n.spotShadow[S]=ne,n.spotShadowMap[S]=B,T++}S++}else if(C.isRectAreaLight){const V=e.get(C);V.color.copy(G).multiplyScalar(Z),V.halfWidth.set(C.width*.5,0,0),V.halfHeight.set(0,C.height*.5,0),n.rectArea[f]=V,f++}else if(C.isPointLight){const V=e.get(C);if(V.color.copy(C.color).multiplyScalar(C.intensity),V.distance=C.distance,V.decay=C.decay,C.castShadow){const j=C.shadow,ne=t.get(C);ne.shadowIntensity=j.intensity,ne.shadowBias=j.bias,ne.shadowNormalBias=j.normalBias,ne.shadowRadius=j.radius,ne.shadowMapSize=j.mapSize,ne.shadowCameraNear=j.camera.near,ne.shadowCameraFar=j.camera.far,n.pointShadow[v]=ne,n.pointShadowMap[v]=B,n.pointShadowMatrix[v]=C.shadow.matrix,y++}n.point[v]=V,v++}else if(C.isHemisphereLight){const V=e.get(C);V.skyColor.copy(C.color).multiplyScalar(Z),V.groundColor.copy(C.groundColor).multiplyScalar(Z),n.hemi[l]=V,l++}}f>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=fe.LTC_FLOAT_1,n.rectAreaLTC2=fe.LTC_FLOAT_2):(n.rectAreaLTC1=fe.LTC_HALF_1,n.rectAreaLTC2=fe.LTC_HALF_2)),n.ambient[0]=p,n.ambient[1]=m,n.ambient[2]=d;const g=n.hash;(g.directionalLength!==_||g.pointLength!==v||g.spotLength!==S||g.rectAreaLength!==f||g.hemiLength!==l||g.numDirectionalShadows!==x||g.numPointShadows!==y||g.numSpotShadows!==T||g.numSpotMaps!==P||g.numLightProbes!==I)&&(n.directional.length=_,n.spot.length=S,n.rectArea.length=f,n.point.length=v,n.hemi.length=l,n.directionalShadow.length=x,n.directionalShadowMap.length=x,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=T,n.spotShadowMap.length=T,n.directionalShadowMatrix.length=x,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=T+P-b,n.spotLightMap.length=P,n.numSpotLightShadowsWithMaps=b,n.numLightProbes=I,g.directionalLength=_,g.pointLength=v,g.spotLength=S,g.rectAreaLength=f,g.hemiLength=l,g.numDirectionalShadows=x,g.numPointShadows=y,g.numSpotShadows=T,g.numSpotMaps=P,g.numLightProbes=I,n.version=qp++)}function u(h,p){let m=0,d=0,_=0,v=0,S=0;const f=p.matrixWorldInverse;for(let l=0,x=h.length;l<x;l++){const y=h[l];if(y.isDirectionalLight){const T=n.directional[m];T.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(f),m++}else if(y.isSpotLight){const T=n.spot[_];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),T.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(f),_++}else if(y.isRectAreaLight){const T=n.rectArea[v];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),a.identity(),r.copy(y.matrixWorld),r.premultiply(f),a.extractRotation(r),T.halfWidth.set(y.width*.5,0,0),T.halfHeight.set(0,y.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),v++}else if(y.isPointLight){const T=n.point[d];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),d++}else if(y.isHemisphereLight){const T=n.hemi[S];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(f),S++}}}return{setup:o,setupView:u,state:n}}function Ko(i){const e=new jp(i),t=[],n=[],s=[];function r(d){m.camera=d,t.length=0,n.length=0,s.length=0}function a(d){t.push(d)}function o(d){n.push(d)}function u(d){s.push(d)}function h(){e.setup(t)}function p(d){e.setupView(t,d)}const m={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:m,setupLights:h,setupLightsView:p,pushLight:a,pushShadow:o,pushLightProbeGrid:u}}function Kp(i){let e=new WeakMap;function t(s,r=0){const a=e.get(s);let o;return a===void 0?(o=new Ko(i),e.set(s,[o])):r>=a.length?(o=new Ko(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const Zp=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$p=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Jp=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],Qp=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],Zo=new ut,Ci=new U,_r=new U;function em(i,e,t){let n=new ba;const s=new qe,r=new qe,a=new dt,o=new au,u=new ou,h={},p=t.maxTextureSize,m={[In]:It,[It]:In,[_n]:_n},d=new cn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new qe},radius:{value:4}},vertexShader:Zp,fragmentShader:$p}),_=d.clone();_.defines.HORIZONTAL_PASS=1;const v=new Tt;v.setAttribute("position",new Wt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new ct(v,d),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ms;let l=this.type;this.render=function(b,I,g){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||b.length===0)return;this.type===Kl&&(Pe("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ms);const A=i.getRenderTarget(),L=i.getActiveCubeFace(),C=i.getActiveMipmapLevel(),G=i.state;G.setBlending(xn),G.buffers.depth.getReversed()===!0?G.buffers.color.setClear(0,0,0,0):G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const Z=l!==this.type;Z&&I.traverse(function($){$.material&&(Array.isArray($.material)?$.material.forEach(B=>B.needsUpdate=!0):$.material.needsUpdate=!0)});for(let $=0,B=b.length;$<B;$++){const V=b[$],j=V.shadow;if(j===void 0){Pe("WebGLShadowMap:",V,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;s.copy(j.mapSize);const ne=j.getFrameExtents();s.multiply(ne),r.copy(j.mapSize),(s.x>p||s.y>p)&&(s.x>p&&(r.x=Math.floor(p/ne.x),s.x=r.x*ne.x,j.mapSize.x=r.x),s.y>p&&(r.y=Math.floor(p/ne.y),s.y=r.y*ne.y,j.mapSize.y=r.y));const ie=i.state.buffers.depth.getReversed();if(j.camera._reversedDepth=ie,j.map===null||Z===!0){if(j.map!==null&&(j.map.depthTexture!==null&&(j.map.depthTexture.dispose(),j.map.depthTexture=null),j.map.dispose()),this.type===Pi){if(V.isPointLight){Pe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}j.map=new on(s.x,s.y,{format:Yn,type:Mn,minFilter:Rt,magFilter:Rt,generateMipmaps:!1}),j.map.texture.name=V.name+".shadowMap",j.map.depthTexture=new gi(s.x,s.y,sn),j.map.depthTexture.name=V.name+".shadowMapDepth",j.map.depthTexture.format=Sn,j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Et,j.map.depthTexture.magFilter=Et}else V.isPointLight?(j.map=new Ll(s.x),j.map.depthTexture=new eu(s.x,ln)):(j.map=new on(s.x,s.y),j.map.depthTexture=new gi(s.x,s.y,ln)),j.map.depthTexture.name=V.name+".shadowMap",j.map.depthTexture.format=Sn,this.type===ms?(j.map.depthTexture.compareFunction=ie?va:xa,j.map.depthTexture.minFilter=Rt,j.map.depthTexture.magFilter=Rt):(j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=Et,j.map.depthTexture.magFilter=Et);j.camera.updateProjectionMatrix()}const le=j.map.isWebGLCubeRenderTarget?6:1;for(let ve=0;ve<le;ve++){if(j.map.isWebGLCubeRenderTarget)i.setRenderTarget(j.map,ve),i.clear();else{ve===0&&(i.setRenderTarget(j.map),i.clear());const Te=j.getViewport(ve);a.set(r.x*Te.x,r.y*Te.y,r.x*Te.z,r.y*Te.w),G.viewport(a)}if(V.isPointLight){const Te=j.camera,Ve=j.matrix,Ke=V.distance||Te.far;Ke!==Te.far&&(Te.far=Ke,Te.updateProjectionMatrix()),Ci.setFromMatrixPosition(V.matrixWorld),Te.position.copy(Ci),_r.copy(Te.position),_r.add(Jp[ve]),Te.up.copy(Qp[ve]),Te.lookAt(_r),Te.updateMatrixWorld(),Ve.makeTranslation(-Ci.x,-Ci.y,-Ci.z),Zo.multiplyMatrices(Te.projectionMatrix,Te.matrixWorldInverse),j._frustum.setFromProjectionMatrix(Zo,Te.coordinateSystem,Te.reversedDepth)}else j.updateMatrices(V);n=j.getFrustum(),T(I,g,j.camera,V,this.type)}j.isPointLightShadow!==!0&&this.type===Pi&&x(j,g),j.needsUpdate=!1}l=this.type,f.needsUpdate=!1,i.setRenderTarget(A,L,C)};function x(b,I){const g=e.update(S);d.defines.VSM_SAMPLES!==b.blurSamples&&(d.defines.VSM_SAMPLES=b.blurSamples,_.defines.VSM_SAMPLES=b.blurSamples,d.needsUpdate=!0,_.needsUpdate=!0),b.mapPass===null&&(b.mapPass=new on(s.x,s.y,{format:Yn,type:Mn})),d.uniforms.shadow_pass.value=b.map.depthTexture,d.uniforms.resolution.value=b.mapSize,d.uniforms.radius.value=b.radius,i.setRenderTarget(b.mapPass),i.clear(),i.renderBufferDirect(I,null,g,d,S,null),_.uniforms.shadow_pass.value=b.mapPass.texture,_.uniforms.resolution.value=b.mapSize,_.uniforms.radius.value=b.radius,i.setRenderTarget(b.map),i.clear(),i.renderBufferDirect(I,null,g,_,S,null)}function y(b,I,g,A){let L=null;const C=g.isPointLight===!0?b.customDistanceMaterial:b.customDepthMaterial;if(C!==void 0)L=C;else if(L=g.isPointLight===!0?u:o,i.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){const G=L.uuid,Z=I.uuid;let $=h[G];$===void 0&&($={},h[G]=$);let B=$[Z];B===void 0&&(B=L.clone(),$[Z]=B,I.addEventListener("dispose",P)),L=B}if(L.visible=I.visible,L.wireframe=I.wireframe,A===Pi?L.side=I.shadowSide!==null?I.shadowSide:I.side:L.side=I.shadowSide!==null?I.shadowSide:m[I.side],L.alphaMap=I.alphaMap,L.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,L.map=I.map,L.clipShadows=I.clipShadows,L.clippingPlanes=I.clippingPlanes,L.clipIntersection=I.clipIntersection,L.displacementMap=I.displacementMap,L.displacementScale=I.displacementScale,L.displacementBias=I.displacementBias,L.wireframeLinewidth=I.wireframeLinewidth,L.linewidth=I.linewidth,g.isPointLight===!0&&L.isMeshDistanceMaterial===!0){const G=i.properties.get(L);G.light=g}return L}function T(b,I,g,A,L){if(b.visible===!1)return;if(b.layers.test(I.layers)&&(b.isMesh||b.isLine||b.isPoints)&&(b.castShadow||b.receiveShadow&&L===Pi)&&(!b.frustumCulled||n.intersectsObject(b))){b.modelViewMatrix.multiplyMatrices(g.matrixWorldInverse,b.matrixWorld);const Z=e.update(b),$=b.material;if(Array.isArray($)){const B=Z.groups;for(let V=0,j=B.length;V<j;V++){const ne=B[V],ie=$[ne.materialIndex];if(ie&&ie.visible){const le=y(b,ie,A,L);b.onBeforeShadow(i,b,I,g,Z,le,ne),i.renderBufferDirect(g,null,Z,le,b,ne),b.onAfterShadow(i,b,I,g,Z,le,ne)}}}else if($.visible){const B=y(b,$,A,L);b.onBeforeShadow(i,b,I,g,Z,B,null),i.renderBufferDirect(g,null,Z,B,b,null),b.onAfterShadow(i,b,I,g,Z,B,null)}}const G=b.children;for(let Z=0,$=G.length;Z<$;Z++)T(G[Z],I,g,A,L)}function P(b){b.target.removeEventListener("dispose",P);for(const g in h){const A=h[g],L=b.target.uuid;L in A&&(A[L].dispose(),delete A[L])}}}function tm(i,e){function t(){let R=!1;const te=new dt;let K=null;const me=new dt(0,0,0,0);return{setMask:function(oe){K!==oe&&!R&&(i.colorMask(oe,oe,oe,oe),K=oe)},setLocked:function(oe){R=oe},setClear:function(oe,ee,Me,Ne,pt){pt===!0&&(oe*=Ne,ee*=Ne,Me*=Ne),te.set(oe,ee,Me,Ne),me.equals(te)===!1&&(i.clearColor(oe,ee,Me,Ne),me.copy(te))},reset:function(){R=!1,K=null,me.set(-1,0,0,0)}}}function n(){let R=!1,te=!1,K=null,me=null,oe=null;return{setReversed:function(ee){if(te!==ee){const Me=e.get("EXT_clip_control");ee?Me.clipControlEXT(Me.LOWER_LEFT_EXT,Me.ZERO_TO_ONE_EXT):Me.clipControlEXT(Me.LOWER_LEFT_EXT,Me.NEGATIVE_ONE_TO_ONE_EXT),te=ee;const Ne=oe;oe=null,this.setClear(Ne)}},getReversed:function(){return te},setTest:function(ee){ee?ae(i.DEPTH_TEST):ye(i.DEPTH_TEST)},setMask:function(ee){K!==ee&&!R&&(i.depthMask(ee),K=ee)},setFunc:function(ee){if(te&&(ee=Rc[ee]),me!==ee){switch(ee){case Mr:i.depthFunc(i.NEVER);break;case Sr:i.depthFunc(i.ALWAYS);break;case Er:i.depthFunc(i.LESS);break;case mi:i.depthFunc(i.LEQUAL);break;case yr:i.depthFunc(i.EQUAL);break;case Tr:i.depthFunc(i.GEQUAL);break;case br:i.depthFunc(i.GREATER);break;case Ar:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}me=ee}},setLocked:function(ee){R=ee},setClear:function(ee){oe!==ee&&(oe=ee,te&&(ee=1-ee),i.clearDepth(ee))},reset:function(){R=!1,K=null,me=null,oe=null,te=!1}}}function s(){let R=!1,te=null,K=null,me=null,oe=null,ee=null,Me=null,Ne=null,pt=null;return{setTest:function(Qe){R||(Qe?ae(i.STENCIL_TEST):ye(i.STENCIL_TEST))},setMask:function(Qe){te!==Qe&&!R&&(i.stencilMask(Qe),te=Qe)},setFunc:function(Qe,un,Zt){(K!==Qe||me!==un||oe!==Zt)&&(i.stencilFunc(Qe,un,Zt),K=Qe,me=un,oe=Zt)},setOp:function(Qe,un,Zt){(ee!==Qe||Me!==un||Ne!==Zt)&&(i.stencilOp(Qe,un,Zt),ee=Qe,Me=un,Ne=Zt)},setLocked:function(Qe){R=Qe},setClear:function(Qe){pt!==Qe&&(i.clearStencil(Qe),pt=Qe)},reset:function(){R=!1,te=null,K=null,me=null,oe=null,ee=null,Me=null,Ne=null,pt=null}}}const r=new t,a=new n,o=new s,u=new WeakMap,h=new WeakMap;let p={},m={},d={},_=new WeakMap,v=[],S=null,f=!1,l=null,x=null,y=null,T=null,P=null,b=null,I=null,g=new We(0,0,0),A=0,L=!1,C=null,G=null,Z=null,$=null,B=null;const V=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let j=!1,ne=0;const ie=i.getParameter(i.VERSION);ie.indexOf("WebGL")!==-1?(ne=parseFloat(/^WebGL (\d)/.exec(ie)[1]),j=ne>=1):ie.indexOf("OpenGL ES")!==-1&&(ne=parseFloat(/^OpenGL ES (\d)/.exec(ie)[1]),j=ne>=2);let le=null,ve={};const Te=i.getParameter(i.SCISSOR_BOX),Ve=i.getParameter(i.VIEWPORT),Ke=new dt().fromArray(Te),De=new dt().fromArray(Ve);function J(R,te,K,me){const oe=new Uint8Array(4),ee=i.createTexture();i.bindTexture(R,ee),i.texParameteri(R,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(R,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Me=0;Me<K;Me++)R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY?i.texImage3D(te,0,i.RGBA,1,1,me,0,i.RGBA,i.UNSIGNED_BYTE,oe):i.texImage2D(te+Me,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,oe);return ee}const he={};he[i.TEXTURE_2D]=J(i.TEXTURE_2D,i.TEXTURE_2D,1),he[i.TEXTURE_CUBE_MAP]=J(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),he[i.TEXTURE_2D_ARRAY]=J(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),he[i.TEXTURE_3D]=J(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ae(i.DEPTH_TEST),a.setFunc(mi),tt(!1),ot(Xa),ae(i.CULL_FACE),Ze(xn);function ae(R){p[R]!==!0&&(i.enable(R),p[R]=!0)}function ye(R){p[R]!==!1&&(i.disable(R),p[R]=!1)}function Le(R,te){return d[R]!==te?(i.bindFramebuffer(R,te),d[R]=te,R===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=te),R===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=te),!0):!1}function we(R,te){let K=v,me=!1;if(R){K=_.get(te),K===void 0&&(K=[],_.set(te,K));const oe=R.textures;if(K.length!==oe.length||K[0]!==i.COLOR_ATTACHMENT0){for(let ee=0,Me=oe.length;ee<Me;ee++)K[ee]=i.COLOR_ATTACHMENT0+ee;K.length=oe.length,me=!0}}else K[0]!==i.BACK&&(K[0]=i.BACK,me=!0);me&&i.drawBuffers(K)}function st(R){return S!==R?(i.useProgram(R),S=R,!0):!1}const ze={[Vn]:i.FUNC_ADD,[$l]:i.FUNC_SUBTRACT,[Jl]:i.FUNC_REVERSE_SUBTRACT};ze[Ql]=i.MIN,ze[ec]=i.MAX;const je={[tc]:i.ZERO,[nc]:i.ONE,[ic]:i.SRC_COLOR,[xr]:i.SRC_ALPHA,[cc]:i.SRC_ALPHA_SATURATE,[oc]:i.DST_COLOR,[rc]:i.DST_ALPHA,[sc]:i.ONE_MINUS_SRC_COLOR,[vr]:i.ONE_MINUS_SRC_ALPHA,[lc]:i.ONE_MINUS_DST_COLOR,[ac]:i.ONE_MINUS_DST_ALPHA,[uc]:i.CONSTANT_COLOR,[hc]:i.ONE_MINUS_CONSTANT_COLOR,[dc]:i.CONSTANT_ALPHA,[fc]:i.ONE_MINUS_CONSTANT_ALPHA};function Ze(R,te,K,me,oe,ee,Me,Ne,pt,Qe){if(R===xn){f===!0&&(ye(i.BLEND),f=!1);return}if(f===!1&&(ae(i.BLEND),f=!0),R!==Zl){if(R!==l||Qe!==L){if((x!==Vn||P!==Vn)&&(i.blendEquation(i.FUNC_ADD),x=Vn,P=Vn),Qe)switch(R){case fi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qa:i.blendFunc(i.ONE,i.ONE);break;case Ya:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ja:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Xe("WebGLState: Invalid blending: ",R);break}else switch(R){case fi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qa:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Ya:Xe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ja:Xe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Xe("WebGLState: Invalid blending: ",R);break}y=null,T=null,b=null,I=null,g.set(0,0,0),A=0,l=R,L=Qe}return}oe=oe||te,ee=ee||K,Me=Me||me,(te!==x||oe!==P)&&(i.blendEquationSeparate(ze[te],ze[oe]),x=te,P=oe),(K!==y||me!==T||ee!==b||Me!==I)&&(i.blendFuncSeparate(je[K],je[me],je[ee],je[Me]),y=K,T=me,b=ee,I=Me),(Ne.equals(g)===!1||pt!==A)&&(i.blendColor(Ne.r,Ne.g,Ne.b,pt),g.copy(Ne),A=pt),l=R,L=!1}function Ue(R,te){R.side===_n?ye(i.CULL_FACE):ae(i.CULL_FACE);let K=R.side===It;te&&(K=!K),tt(K),R.blending===fi&&R.transparent===!1?Ze(xn):Ze(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.blendColor,R.blendAlpha,R.premultipliedAlpha),a.setFunc(R.depthFunc),a.setTest(R.depthTest),a.setMask(R.depthWrite),r.setMask(R.colorWrite);const me=R.stencilWrite;o.setTest(me),me&&(o.setMask(R.stencilWriteMask),o.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),o.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),N(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===!0?ae(i.SAMPLE_ALPHA_TO_COVERAGE):ye(i.SAMPLE_ALPHA_TO_COVERAGE)}function tt(R){C!==R&&(R?i.frontFace(i.CW):i.frontFace(i.CCW),C=R)}function ot(R){R!==Yl?(ae(i.CULL_FACE),R!==G&&(R===Xa?i.cullFace(i.BACK):R===jl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ye(i.CULL_FACE),G=R}function Ct(R){R!==Z&&(j&&i.lineWidth(R),Z=R)}function N(R,te,K){R?(ae(i.POLYGON_OFFSET_FILL),($!==te||B!==K)&&($=te,B=K,a.getReversed()&&(te=-te),i.polygonOffset(te,K))):ye(i.POLYGON_OFFSET_FILL)}function ft(R){R?ae(i.SCISSOR_TEST):ye(i.SCISSOR_TEST)}function Oe(R){R===void 0&&(R=i.TEXTURE0+V-1),le!==R&&(i.activeTexture(R),le=R)}function Je(R,te,K){K===void 0&&(le===null?K=i.TEXTURE0+V-1:K=le);let me=ve[K];me===void 0&&(me={type:void 0,texture:void 0},ve[K]=me),(me.type!==R||me.texture!==te)&&(le!==K&&(i.activeTexture(K),le=K),i.bindTexture(R,te||he[R]),me.type=R,me.texture=te)}function ce(){const R=ve[le];R!==void 0&&R.type!==void 0&&(i.bindTexture(R.type,null),R.type=void 0,R.texture=void 0)}function rt(){try{i.compressedTexImage2D(...arguments)}catch(R){Xe("WebGLState:",R)}}function E(){try{i.compressedTexImage3D(...arguments)}catch(R){Xe("WebGLState:",R)}}function c(){try{i.texSubImage2D(...arguments)}catch(R){Xe("WebGLState:",R)}}function w(){try{i.texSubImage3D(...arguments)}catch(R){Xe("WebGLState:",R)}}function D(){try{i.compressedTexSubImage2D(...arguments)}catch(R){Xe("WebGLState:",R)}}function k(){try{i.compressedTexSubImage3D(...arguments)}catch(R){Xe("WebGLState:",R)}}function F(){try{i.texStorage2D(...arguments)}catch(R){Xe("WebGLState:",R)}}function H(){try{i.texStorage3D(...arguments)}catch(R){Xe("WebGLState:",R)}}function z(){try{i.texImage2D(...arguments)}catch(R){Xe("WebGLState:",R)}}function q(){try{i.texImage3D(...arguments)}catch(R){Xe("WebGLState:",R)}}function Q(R){return m[R]!==void 0?m[R]:i.getParameter(R)}function ue(R,te){m[R]!==te&&(i.pixelStorei(R,te),m[R]=te)}function se(R){Ke.equals(R)===!1&&(i.scissor(R.x,R.y,R.z,R.w),Ke.copy(R))}function re(R){De.equals(R)===!1&&(i.viewport(R.x,R.y,R.z,R.w),De.copy(R))}function Ce(R,te){let K=h.get(te);K===void 0&&(K=new WeakMap,h.set(te,K));let me=K.get(R);me===void 0&&(me=i.getUniformBlockIndex(te,R.name),K.set(R,me))}function de(R,te){const me=h.get(te).get(R);u.get(te)!==me&&(i.uniformBlockBinding(te,me,R.__bindingPointIndex),u.set(te,me))}function Re(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),p={},m={},le=null,ve={},d={},_=new WeakMap,v=[],S=null,f=!1,l=null,x=null,y=null,T=null,P=null,b=null,I=null,g=new We(0,0,0),A=0,L=!1,C=null,G=null,Z=null,$=null,B=null,Ke.set(0,0,i.canvas.width,i.canvas.height),De.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ae,disable:ye,bindFramebuffer:Le,drawBuffers:we,useProgram:st,setBlending:Ze,setMaterial:Ue,setFlipSided:tt,setCullFace:ot,setLineWidth:Ct,setPolygonOffset:N,setScissorTest:ft,activeTexture:Oe,bindTexture:Je,unbindTexture:ce,compressedTexImage2D:rt,compressedTexImage3D:E,texImage2D:z,texImage3D:q,pixelStorei:ue,getParameter:Q,updateUBOMapping:Ce,uniformBlockBinding:de,texStorage2D:F,texStorage3D:H,texSubImage2D:c,texSubImage3D:w,compressedTexSubImage2D:D,compressedTexSubImage3D:k,scissor:se,viewport:re,reset:Re}}function nm(i,e,t,n,s,r,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,u=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new qe,p=new WeakMap,m=new Set;let d;const _=new WeakMap;let v=!1;try{v=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(E,c){return v?new OffscreenCanvas(E,c):bs("canvas")}function f(E,c,w){let D=1;const k=rt(E);if((k.width>w||k.height>w)&&(D=w/Math.max(k.width,k.height)),D<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const F=Math.floor(D*k.width),H=Math.floor(D*k.height);d===void 0&&(d=S(F,H));const z=c?S(F,H):d;return z.width=F,z.height=H,z.getContext("2d").drawImage(E,0,0,F,H),Pe("WebGLRenderer: Texture has been resized from ("+k.width+"x"+k.height+") to ("+F+"x"+H+")."),z}else return"data"in E&&Pe("WebGLRenderer: Image in DataTexture is too big ("+k.width+"x"+k.height+")."),E;return E}function l(E){return E.generateMipmaps}function x(E){i.generateMipmap(E)}function y(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function T(E,c,w,D,k,F=!1){if(E!==null){if(i[E]!==void 0)return i[E];Pe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let H;D&&(H=e.get("EXT_texture_norm16"),H||Pe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let z=c;if(c===i.RED&&(w===i.FLOAT&&(z=i.R32F),w===i.HALF_FLOAT&&(z=i.R16F),w===i.UNSIGNED_BYTE&&(z=i.R8),w===i.UNSIGNED_SHORT&&H&&(z=H.R16_EXT),w===i.SHORT&&H&&(z=H.R16_SNORM_EXT)),c===i.RED_INTEGER&&(w===i.UNSIGNED_BYTE&&(z=i.R8UI),w===i.UNSIGNED_SHORT&&(z=i.R16UI),w===i.UNSIGNED_INT&&(z=i.R32UI),w===i.BYTE&&(z=i.R8I),w===i.SHORT&&(z=i.R16I),w===i.INT&&(z=i.R32I)),c===i.RG&&(w===i.FLOAT&&(z=i.RG32F),w===i.HALF_FLOAT&&(z=i.RG16F),w===i.UNSIGNED_BYTE&&(z=i.RG8),w===i.UNSIGNED_SHORT&&H&&(z=H.RG16_EXT),w===i.SHORT&&H&&(z=H.RG16_SNORM_EXT)),c===i.RG_INTEGER&&(w===i.UNSIGNED_BYTE&&(z=i.RG8UI),w===i.UNSIGNED_SHORT&&(z=i.RG16UI),w===i.UNSIGNED_INT&&(z=i.RG32UI),w===i.BYTE&&(z=i.RG8I),w===i.SHORT&&(z=i.RG16I),w===i.INT&&(z=i.RG32I)),c===i.RGB_INTEGER&&(w===i.UNSIGNED_BYTE&&(z=i.RGB8UI),w===i.UNSIGNED_SHORT&&(z=i.RGB16UI),w===i.UNSIGNED_INT&&(z=i.RGB32UI),w===i.BYTE&&(z=i.RGB8I),w===i.SHORT&&(z=i.RGB16I),w===i.INT&&(z=i.RGB32I)),c===i.RGBA_INTEGER&&(w===i.UNSIGNED_BYTE&&(z=i.RGBA8UI),w===i.UNSIGNED_SHORT&&(z=i.RGBA16UI),w===i.UNSIGNED_INT&&(z=i.RGBA32UI),w===i.BYTE&&(z=i.RGBA8I),w===i.SHORT&&(z=i.RGBA16I),w===i.INT&&(z=i.RGBA32I)),c===i.RGB&&(w===i.UNSIGNED_SHORT&&H&&(z=H.RGB16_EXT),w===i.SHORT&&H&&(z=H.RGB16_SNORM_EXT),w===i.UNSIGNED_INT_5_9_9_9_REV&&(z=i.RGB9_E5),w===i.UNSIGNED_INT_10F_11F_11F_REV&&(z=i.R11F_G11F_B10F)),c===i.RGBA){const q=F?Ts:He.getTransfer(k);w===i.FLOAT&&(z=i.RGBA32F),w===i.HALF_FLOAT&&(z=i.RGBA16F),w===i.UNSIGNED_BYTE&&(z=q===$e?i.SRGB8_ALPHA8:i.RGBA8),w===i.UNSIGNED_SHORT&&H&&(z=H.RGBA16_EXT),w===i.SHORT&&H&&(z=H.RGBA16_SNORM_EXT),w===i.UNSIGNED_SHORT_4_4_4_4&&(z=i.RGBA4),w===i.UNSIGNED_SHORT_5_5_5_1&&(z=i.RGB5_A1)}return(z===i.R16F||z===i.R32F||z===i.RG16F||z===i.RG32F||z===i.RGBA16F||z===i.RGBA32F)&&e.get("EXT_color_buffer_float"),z}function P(E,c){let w;return E?c===null||c===ln||c===Ui?w=i.DEPTH24_STENCIL8:c===sn?w=i.DEPTH32F_STENCIL8:c===Ii&&(w=i.DEPTH24_STENCIL8,Pe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):c===null||c===ln||c===Ui?w=i.DEPTH_COMPONENT24:c===sn?w=i.DEPTH_COMPONENT32F:c===Ii&&(w=i.DEPTH_COMPONENT16),w}function b(E,c){return l(E)===!0||E.isFramebufferTexture&&E.minFilter!==Et&&E.minFilter!==Rt?Math.log2(Math.max(c.width,c.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?c.mipmaps.length:1}function I(E){const c=E.target;c.removeEventListener("dispose",I),A(c),c.isVideoTexture&&p.delete(c),c.isHTMLTexture&&m.delete(c)}function g(E){const c=E.target;c.removeEventListener("dispose",g),C(c)}function A(E){const c=n.get(E);if(c.__webglInit===void 0)return;const w=E.source,D=_.get(w);if(D){const k=D[c.__cacheKey];k.usedTimes--,k.usedTimes===0&&L(E),Object.keys(D).length===0&&_.delete(w)}n.remove(E)}function L(E){const c=n.get(E);i.deleteTexture(c.__webglTexture);const w=E.source,D=_.get(w);delete D[c.__cacheKey],a.memory.textures--}function C(E){const c=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let D=0;D<6;D++){if(Array.isArray(c.__webglFramebuffer[D]))for(let k=0;k<c.__webglFramebuffer[D].length;k++)i.deleteFramebuffer(c.__webglFramebuffer[D][k]);else i.deleteFramebuffer(c.__webglFramebuffer[D]);c.__webglDepthbuffer&&i.deleteRenderbuffer(c.__webglDepthbuffer[D])}else{if(Array.isArray(c.__webglFramebuffer))for(let D=0;D<c.__webglFramebuffer.length;D++)i.deleteFramebuffer(c.__webglFramebuffer[D]);else i.deleteFramebuffer(c.__webglFramebuffer);if(c.__webglDepthbuffer&&i.deleteRenderbuffer(c.__webglDepthbuffer),c.__webglMultisampledFramebuffer&&i.deleteFramebuffer(c.__webglMultisampledFramebuffer),c.__webglColorRenderbuffer)for(let D=0;D<c.__webglColorRenderbuffer.length;D++)c.__webglColorRenderbuffer[D]&&i.deleteRenderbuffer(c.__webglColorRenderbuffer[D]);c.__webglDepthRenderbuffer&&i.deleteRenderbuffer(c.__webglDepthRenderbuffer)}const w=E.textures;for(let D=0,k=w.length;D<k;D++){const F=n.get(w[D]);F.__webglTexture&&(i.deleteTexture(F.__webglTexture),a.memory.textures--),n.remove(w[D])}n.remove(E)}let G=0;function Z(){G=0}function $(){return G}function B(E){G=E}function V(){const E=G;return E>=s.maxTextures&&Pe("WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),G+=1,E}function j(E){const c=[];return c.push(E.wrapS),c.push(E.wrapT),c.push(E.wrapR||0),c.push(E.magFilter),c.push(E.minFilter),c.push(E.anisotropy),c.push(E.internalFormat),c.push(E.format),c.push(E.type),c.push(E.generateMipmaps),c.push(E.premultiplyAlpha),c.push(E.flipY),c.push(E.unpackAlignment),c.push(E.colorSpace),c.join()}function ne(E,c){const w=n.get(E);if(E.isVideoTexture&&Je(E),E.isRenderTargetTexture===!1&&E.isExternalTexture!==!0&&E.version>0&&w.__version!==E.version){const D=E.image;if(D===null)Pe("WebGLRenderer: Texture marked for update but no image data found.");else if(D.complete===!1)Pe("WebGLRenderer: Texture marked for update but image is incomplete");else{ye(w,E,c);return}}else E.isExternalTexture&&(w.__webglTexture=E.sourceTexture?E.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,w.__webglTexture,i.TEXTURE0+c)}function ie(E,c){const w=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&w.__version!==E.version){ye(w,E,c);return}else E.isExternalTexture&&(w.__webglTexture=E.sourceTexture?E.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,w.__webglTexture,i.TEXTURE0+c)}function le(E,c){const w=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&w.__version!==E.version){ye(w,E,c);return}t.bindTexture(i.TEXTURE_3D,w.__webglTexture,i.TEXTURE0+c)}function ve(E,c){const w=n.get(E);if(E.isCubeDepthTexture!==!0&&E.version>0&&w.__version!==E.version){Le(w,E,c);return}t.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+c)}const Te={[wr]:i.REPEAT,[gn]:i.CLAMP_TO_EDGE,[Rr]:i.MIRRORED_REPEAT},Ve={[Et]:i.NEAREST,[_c]:i.NEAREST_MIPMAP_NEAREST,[Vi]:i.NEAREST_MIPMAP_LINEAR,[Rt]:i.LINEAR,[Bs]:i.LINEAR_MIPMAP_NEAREST,[kn]:i.LINEAR_MIPMAP_LINEAR},Ke={[vc]:i.NEVER,[Tc]:i.ALWAYS,[Mc]:i.LESS,[xa]:i.LEQUAL,[Sc]:i.EQUAL,[va]:i.GEQUAL,[Ec]:i.GREATER,[yc]:i.NOTEQUAL};function De(E,c){if(c.type===sn&&e.has("OES_texture_float_linear")===!1&&(c.magFilter===Rt||c.magFilter===Bs||c.magFilter===Vi||c.magFilter===kn||c.minFilter===Rt||c.minFilter===Bs||c.minFilter===Vi||c.minFilter===kn)&&Pe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,Te[c.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,Te[c.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,Te[c.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,Ve[c.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,Ve[c.minFilter]),c.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,Ke[c.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(c.magFilter===Et||c.minFilter!==Vi&&c.minFilter!==kn||c.type===sn&&e.has("OES_texture_float_linear")===!1)return;if(c.anisotropy>1||n.get(c).__currentAnisotropy){const w=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,w.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(c.anisotropy,s.getMaxAnisotropy())),n.get(c).__currentAnisotropy=c.anisotropy}}}function J(E,c){let w=!1;E.__webglInit===void 0&&(E.__webglInit=!0,c.addEventListener("dispose",I));const D=c.source;let k=_.get(D);k===void 0&&(k={},_.set(D,k));const F=j(c);if(F!==E.__cacheKey){k[F]===void 0&&(k[F]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,w=!0),k[F].usedTimes++;const H=k[E.__cacheKey];H!==void 0&&(k[E.__cacheKey].usedTimes--,H.usedTimes===0&&L(c)),E.__cacheKey=F,E.__webglTexture=k[F].texture}return w}function he(E,c,w){return Math.floor(Math.floor(E/w)/c)}function ae(E,c,w,D){const F=E.updateRanges;if(F.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,c.width,c.height,w,D,c.data);else{F.sort((ue,se)=>ue.start-se.start);let H=0;for(let ue=1;ue<F.length;ue++){const se=F[H],re=F[ue],Ce=se.start+se.count,de=he(re.start,c.width,4),Re=he(se.start,c.width,4);re.start<=Ce+1&&de===Re&&he(re.start+re.count-1,c.width,4)===de?se.count=Math.max(se.count,re.start+re.count-se.start):(++H,F[H]=re)}F.length=H+1;const z=t.getParameter(i.UNPACK_ROW_LENGTH),q=t.getParameter(i.UNPACK_SKIP_PIXELS),Q=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,c.width);for(let ue=0,se=F.length;ue<se;ue++){const re=F[ue],Ce=Math.floor(re.start/4),de=Math.ceil(re.count/4),Re=Ce%c.width,R=Math.floor(Ce/c.width),te=de,K=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,Re),t.pixelStorei(i.UNPACK_SKIP_ROWS,R),t.texSubImage2D(i.TEXTURE_2D,0,Re,R,te,K,w,D,c.data)}E.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,z),t.pixelStorei(i.UNPACK_SKIP_PIXELS,q),t.pixelStorei(i.UNPACK_SKIP_ROWS,Q)}}function ye(E,c,w){let D=i.TEXTURE_2D;(c.isDataArrayTexture||c.isCompressedArrayTexture)&&(D=i.TEXTURE_2D_ARRAY),c.isData3DTexture&&(D=i.TEXTURE_3D);const k=J(E,c),F=c.source;t.bindTexture(D,E.__webglTexture,i.TEXTURE0+w);const H=n.get(F);if(F.version!==H.__version||k===!0){if(t.activeTexture(i.TEXTURE0+w),(typeof ImageBitmap<"u"&&c.image instanceof ImageBitmap)===!1){const K=He.getPrimaries(He.workingColorSpace),me=c.colorSpace===Ln?null:He.getPrimaries(c.colorSpace),oe=c.colorSpace===Ln||K===me?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,c.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,c.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,oe)}t.pixelStorei(i.UNPACK_ALIGNMENT,c.unpackAlignment);let q=f(c.image,!1,s.maxTextureSize);q=ce(c,q);const Q=r.convert(c.format,c.colorSpace),ue=r.convert(c.type);let se=T(c.internalFormat,Q,ue,c.normalized,c.colorSpace,c.isVideoTexture);De(D,c);let re;const Ce=c.mipmaps,de=c.isVideoTexture!==!0,Re=H.__version===void 0||k===!0,R=F.dataReady,te=b(c,q);if(c.isDepthTexture)se=P(c.format===Wn,c.type),Re&&(de?t.texStorage2D(i.TEXTURE_2D,1,se,q.width,q.height):t.texImage2D(i.TEXTURE_2D,0,se,q.width,q.height,0,Q,ue,null));else if(c.isDataTexture)if(Ce.length>0){de&&Re&&t.texStorage2D(i.TEXTURE_2D,te,se,Ce[0].width,Ce[0].height);for(let K=0,me=Ce.length;K<me;K++)re=Ce[K],de?R&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,re.width,re.height,Q,ue,re.data):t.texImage2D(i.TEXTURE_2D,K,se,re.width,re.height,0,Q,ue,re.data);c.generateMipmaps=!1}else de?(Re&&t.texStorage2D(i.TEXTURE_2D,te,se,q.width,q.height),R&&ae(c,q,Q,ue)):t.texImage2D(i.TEXTURE_2D,0,se,q.width,q.height,0,Q,ue,q.data);else if(c.isCompressedTexture)if(c.isCompressedArrayTexture){de&&Re&&t.texStorage3D(i.TEXTURE_2D_ARRAY,te,se,Ce[0].width,Ce[0].height,q.depth);for(let K=0,me=Ce.length;K<me;K++)if(re=Ce[K],c.format!==Kt)if(Q!==null)if(de){if(R)if(c.layerUpdates.size>0){const oe=wo(re.width,re.height,c.format,c.type);for(const ee of c.layerUpdates){const Me=re.data.subarray(ee*oe/re.data.BYTES_PER_ELEMENT,(ee+1)*oe/re.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,ee,re.width,re.height,1,Q,Me)}c.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,re.width,re.height,q.depth,Q,re.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,K,se,re.width,re.height,q.depth,0,re.data,0,0);else Pe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else de?R&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,K,0,0,0,re.width,re.height,q.depth,Q,ue,re.data):t.texImage3D(i.TEXTURE_2D_ARRAY,K,se,re.width,re.height,q.depth,0,Q,ue,re.data)}else{de&&Re&&t.texStorage2D(i.TEXTURE_2D,te,se,Ce[0].width,Ce[0].height);for(let K=0,me=Ce.length;K<me;K++)re=Ce[K],c.format!==Kt?Q!==null?de?R&&t.compressedTexSubImage2D(i.TEXTURE_2D,K,0,0,re.width,re.height,Q,re.data):t.compressedTexImage2D(i.TEXTURE_2D,K,se,re.width,re.height,0,re.data):Pe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):de?R&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,re.width,re.height,Q,ue,re.data):t.texImage2D(i.TEXTURE_2D,K,se,re.width,re.height,0,Q,ue,re.data)}else if(c.isDataArrayTexture)if(de){if(Re&&t.texStorage3D(i.TEXTURE_2D_ARRAY,te,se,q.width,q.height,q.depth),R)if(c.layerUpdates.size>0){const K=wo(q.width,q.height,c.format,c.type);for(const me of c.layerUpdates){const oe=q.data.subarray(me*K/q.data.BYTES_PER_ELEMENT,(me+1)*K/q.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,me,q.width,q.height,1,Q,ue,oe)}c.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,q.width,q.height,q.depth,Q,ue,q.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,se,q.width,q.height,q.depth,0,Q,ue,q.data);else if(c.isData3DTexture)de?(Re&&t.texStorage3D(i.TEXTURE_3D,te,se,q.width,q.height,q.depth),R&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,q.width,q.height,q.depth,Q,ue,q.data)):t.texImage3D(i.TEXTURE_3D,0,se,q.width,q.height,q.depth,0,Q,ue,q.data);else if(c.isFramebufferTexture){if(Re)if(de)t.texStorage2D(i.TEXTURE_2D,te,se,q.width,q.height);else{let K=q.width,me=q.height;for(let oe=0;oe<te;oe++)t.texImage2D(i.TEXTURE_2D,oe,se,K,me,0,Q,ue,null),K>>=1,me>>=1}}else if(c.isHTMLTexture){if("texElementImage2D"in i){const K=i.canvas;if(K.hasAttribute("layoutsubtree")||K.setAttribute("layoutsubtree","true"),q.parentNode!==K){K.appendChild(q),m.add(c),K.onpaint=Ne=>{const pt=Ne.changedElements;for(const Qe of m)pt.includes(Qe.image)&&(Qe.needsUpdate=!0)},K.requestPaint();return}const me=0,oe=i.RGBA,ee=i.RGBA,Me=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,me,oe,ee,Me,q),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ce.length>0){if(de&&Re){const K=rt(Ce[0]);t.texStorage2D(i.TEXTURE_2D,te,se,K.width,K.height)}for(let K=0,me=Ce.length;K<me;K++)re=Ce[K],de?R&&t.texSubImage2D(i.TEXTURE_2D,K,0,0,Q,ue,re):t.texImage2D(i.TEXTURE_2D,K,se,Q,ue,re);c.generateMipmaps=!1}else if(de){if(Re){const K=rt(q);t.texStorage2D(i.TEXTURE_2D,te,se,K.width,K.height)}R&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Q,ue,q)}else t.texImage2D(i.TEXTURE_2D,0,se,Q,ue,q);l(c)&&x(D),H.__version=F.version,c.onUpdate&&c.onUpdate(c)}E.__version=c.version}function Le(E,c,w){if(c.image.length!==6)return;const D=J(E,c),k=c.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+w);const F=n.get(k);if(k.version!==F.__version||D===!0){t.activeTexture(i.TEXTURE0+w);const H=He.getPrimaries(He.workingColorSpace),z=c.colorSpace===Ln?null:He.getPrimaries(c.colorSpace),q=c.colorSpace===Ln||H===z?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,c.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,c.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,c.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,q);const Q=c.isCompressedTexture||c.image[0].isCompressedTexture,ue=c.image[0]&&c.image[0].isDataTexture,se=[];for(let ee=0;ee<6;ee++)!Q&&!ue?se[ee]=f(c.image[ee],!0,s.maxCubemapSize):se[ee]=ue?c.image[ee].image:c.image[ee],se[ee]=ce(c,se[ee]);const re=se[0],Ce=r.convert(c.format,c.colorSpace),de=r.convert(c.type),Re=T(c.internalFormat,Ce,de,c.normalized,c.colorSpace),R=c.isVideoTexture!==!0,te=F.__version===void 0||D===!0,K=k.dataReady;let me=b(c,re);De(i.TEXTURE_CUBE_MAP,c);let oe;if(Q){R&&te&&t.texStorage2D(i.TEXTURE_CUBE_MAP,me,Re,re.width,re.height);for(let ee=0;ee<6;ee++){oe=se[ee].mipmaps;for(let Me=0;Me<oe.length;Me++){const Ne=oe[Me];c.format!==Kt?Ce!==null?R?K&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me,0,0,Ne.width,Ne.height,Ce,Ne.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me,Re,Ne.width,Ne.height,0,Ne.data):Pe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):R?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me,0,0,Ne.width,Ne.height,Ce,de,Ne.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me,Re,Ne.width,Ne.height,0,Ce,de,Ne.data)}}}else{if(oe=c.mipmaps,R&&te){oe.length>0&&me++;const ee=rt(se[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,me,Re,ee.width,ee.height)}for(let ee=0;ee<6;ee++)if(ue){R?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,se[ee].width,se[ee].height,Ce,de,se[ee].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Re,se[ee].width,se[ee].height,0,Ce,de,se[ee].data);for(let Me=0;Me<oe.length;Me++){const pt=oe[Me].image[ee].image;R?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me+1,0,0,pt.width,pt.height,Ce,de,pt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me+1,Re,pt.width,pt.height,0,Ce,de,pt.data)}}else{R?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,0,0,Ce,de,se[ee]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,0,Re,Ce,de,se[ee]);for(let Me=0;Me<oe.length;Me++){const Ne=oe[Me];R?K&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me+1,0,0,Ce,de,Ne.image[ee]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ee,Me+1,Re,Ce,de,Ne.image[ee])}}}l(c)&&x(i.TEXTURE_CUBE_MAP),F.__version=k.version,c.onUpdate&&c.onUpdate(c)}E.__version=c.version}function we(E,c,w,D,k,F){const H=r.convert(w.format,w.colorSpace),z=r.convert(w.type),q=T(w.internalFormat,H,z,w.normalized,w.colorSpace),Q=n.get(c),ue=n.get(w);if(ue.__renderTarget=c,!Q.__hasExternalTextures){const se=Math.max(1,c.width>>F),re=Math.max(1,c.height>>F);k===i.TEXTURE_3D||k===i.TEXTURE_2D_ARRAY?t.texImage3D(k,F,q,se,re,c.depth,0,H,z,null):t.texImage2D(k,F,q,se,re,0,H,z,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),Oe(c)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,D,k,ue.__webglTexture,0,ft(c)):(k===i.TEXTURE_2D||k>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&k<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,D,k,ue.__webglTexture,F),t.bindFramebuffer(i.FRAMEBUFFER,null)}function st(E,c,w){if(i.bindRenderbuffer(i.RENDERBUFFER,E),c.depthBuffer){const D=c.depthTexture,k=D&&D.isDepthTexture?D.type:null,F=P(c.stencilBuffer,k),H=c.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;Oe(c)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ft(c),F,c.width,c.height):w?i.renderbufferStorageMultisample(i.RENDERBUFFER,ft(c),F,c.width,c.height):i.renderbufferStorage(i.RENDERBUFFER,F,c.width,c.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,H,i.RENDERBUFFER,E)}else{const D=c.textures;for(let k=0;k<D.length;k++){const F=D[k],H=r.convert(F.format,F.colorSpace),z=r.convert(F.type),q=T(F.internalFormat,H,z,F.normalized,F.colorSpace);Oe(c)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ft(c),q,c.width,c.height):w?i.renderbufferStorageMultisample(i.RENDERBUFFER,ft(c),q,c.width,c.height):i.renderbufferStorage(i.RENDERBUFFER,q,c.width,c.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ze(E,c,w){const D=c.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(c.depthTexture&&c.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const k=n.get(c.depthTexture);if(k.__renderTarget=c,(!k.__webglTexture||c.depthTexture.image.width!==c.width||c.depthTexture.image.height!==c.height)&&(c.depthTexture.image.width=c.width,c.depthTexture.image.height=c.height,c.depthTexture.needsUpdate=!0),D){if(k.__webglInit===void 0&&(k.__webglInit=!0,c.depthTexture.addEventListener("dispose",I)),k.__webglTexture===void 0){k.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture),De(i.TEXTURE_CUBE_MAP,c.depthTexture);const Q=r.convert(c.depthTexture.format),ue=r.convert(c.depthTexture.type);let se;c.depthTexture.format===Sn?se=i.DEPTH_COMPONENT24:c.depthTexture.format===Wn&&(se=i.DEPTH24_STENCIL8);for(let re=0;re<6;re++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+re,0,se,c.width,c.height,0,Q,ue,null)}}else ne(c.depthTexture,0);const F=k.__webglTexture,H=ft(c),z=D?i.TEXTURE_CUBE_MAP_POSITIVE_X+w:i.TEXTURE_2D,q=c.depthTexture.format===Wn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(c.depthTexture.format===Sn)Oe(c)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,q,z,F,0,H):i.framebufferTexture2D(i.FRAMEBUFFER,q,z,F,0);else if(c.depthTexture.format===Wn)Oe(c)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,q,z,F,0,H):i.framebufferTexture2D(i.FRAMEBUFFER,q,z,F,0);else throw new Error("Unknown depthTexture format")}function je(E){const c=n.get(E),w=E.isWebGLCubeRenderTarget===!0;if(c.__boundDepthTexture!==E.depthTexture){const D=E.depthTexture;if(c.__depthDisposeCallback&&c.__depthDisposeCallback(),D){const k=()=>{delete c.__boundDepthTexture,delete c.__depthDisposeCallback,D.removeEventListener("dispose",k)};D.addEventListener("dispose",k),c.__depthDisposeCallback=k}c.__boundDepthTexture=D}if(E.depthTexture&&!c.__autoAllocateDepthBuffer)if(w)for(let D=0;D<6;D++)ze(c.__webglFramebuffer[D],E,D);else{const D=E.texture.mipmaps;D&&D.length>0?ze(c.__webglFramebuffer[0],E,0):ze(c.__webglFramebuffer,E,0)}else if(w){c.__webglDepthbuffer=[];for(let D=0;D<6;D++)if(t.bindFramebuffer(i.FRAMEBUFFER,c.__webglFramebuffer[D]),c.__webglDepthbuffer[D]===void 0)c.__webglDepthbuffer[D]=i.createRenderbuffer(),st(c.__webglDepthbuffer[D],E,!1);else{const k=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,F=c.__webglDepthbuffer[D];i.bindRenderbuffer(i.RENDERBUFFER,F),i.framebufferRenderbuffer(i.FRAMEBUFFER,k,i.RENDERBUFFER,F)}}else{const D=E.texture.mipmaps;if(D&&D.length>0?t.bindFramebuffer(i.FRAMEBUFFER,c.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,c.__webglFramebuffer),c.__webglDepthbuffer===void 0)c.__webglDepthbuffer=i.createRenderbuffer(),st(c.__webglDepthbuffer,E,!1);else{const k=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,F=c.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,F),i.framebufferRenderbuffer(i.FRAMEBUFFER,k,i.RENDERBUFFER,F)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ze(E,c,w){const D=n.get(E);c!==void 0&&we(D.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),w!==void 0&&je(E)}function Ue(E){const c=E.texture,w=n.get(E),D=n.get(c);E.addEventListener("dispose",g);const k=E.textures,F=E.isWebGLCubeRenderTarget===!0,H=k.length>1;if(H||(D.__webglTexture===void 0&&(D.__webglTexture=i.createTexture()),D.__version=c.version,a.memory.textures++),F){w.__webglFramebuffer=[];for(let z=0;z<6;z++)if(c.mipmaps&&c.mipmaps.length>0){w.__webglFramebuffer[z]=[];for(let q=0;q<c.mipmaps.length;q++)w.__webglFramebuffer[z][q]=i.createFramebuffer()}else w.__webglFramebuffer[z]=i.createFramebuffer()}else{if(c.mipmaps&&c.mipmaps.length>0){w.__webglFramebuffer=[];for(let z=0;z<c.mipmaps.length;z++)w.__webglFramebuffer[z]=i.createFramebuffer()}else w.__webglFramebuffer=i.createFramebuffer();if(H)for(let z=0,q=k.length;z<q;z++){const Q=n.get(k[z]);Q.__webglTexture===void 0&&(Q.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&Oe(E)===!1){w.__webglMultisampledFramebuffer=i.createFramebuffer(),w.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,w.__webglMultisampledFramebuffer);for(let z=0;z<k.length;z++){const q=k[z];w.__webglColorRenderbuffer[z]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,w.__webglColorRenderbuffer[z]);const Q=r.convert(q.format,q.colorSpace),ue=r.convert(q.type),se=T(q.internalFormat,Q,ue,q.normalized,q.colorSpace,E.isXRRenderTarget===!0),re=ft(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,re,se,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+z,i.RENDERBUFFER,w.__webglColorRenderbuffer[z])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(w.__webglDepthRenderbuffer=i.createRenderbuffer(),st(w.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(F){t.bindTexture(i.TEXTURE_CUBE_MAP,D.__webglTexture),De(i.TEXTURE_CUBE_MAP,c);for(let z=0;z<6;z++)if(c.mipmaps&&c.mipmaps.length>0)for(let q=0;q<c.mipmaps.length;q++)we(w.__webglFramebuffer[z][q],E,c,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+z,q);else we(w.__webglFramebuffer[z],E,c,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+z,0);l(c)&&x(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(H){for(let z=0,q=k.length;z<q;z++){const Q=k[z],ue=n.get(Q);let se=i.TEXTURE_2D;(E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(se=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(se,ue.__webglTexture),De(se,Q),we(w.__webglFramebuffer,E,Q,i.COLOR_ATTACHMENT0+z,se,0),l(Q)&&x(se)}t.unbindTexture()}else{let z=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(z=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(z,D.__webglTexture),De(z,c),c.mipmaps&&c.mipmaps.length>0)for(let q=0;q<c.mipmaps.length;q++)we(w.__webglFramebuffer[q],E,c,i.COLOR_ATTACHMENT0,z,q);else we(w.__webglFramebuffer,E,c,i.COLOR_ATTACHMENT0,z,0);l(c)&&x(z),t.unbindTexture()}E.depthBuffer&&je(E)}function tt(E){const c=E.textures;for(let w=0,D=c.length;w<D;w++){const k=c[w];if(l(k)){const F=y(E),H=n.get(k).__webglTexture;t.bindTexture(F,H),x(F),t.unbindTexture()}}}const ot=[],Ct=[];function N(E){if(E.samples>0){if(Oe(E)===!1){const c=E.textures,w=E.width,D=E.height;let k=i.COLOR_BUFFER_BIT;const F=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,H=n.get(E),z=c.length>1;if(z)for(let Q=0;Q<c.length;Q++)t.bindFramebuffer(i.FRAMEBUFFER,H.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Q,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,H.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Q,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,H.__webglMultisampledFramebuffer);const q=E.texture.mipmaps;q&&q.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,H.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,H.__webglFramebuffer);for(let Q=0;Q<c.length;Q++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(k|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(k|=i.STENCIL_BUFFER_BIT)),z){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,H.__webglColorRenderbuffer[Q]);const ue=n.get(c[Q]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ue,0)}i.blitFramebuffer(0,0,w,D,0,0,w,D,k,i.NEAREST),u===!0&&(ot.length=0,Ct.length=0,ot.push(i.COLOR_ATTACHMENT0+Q),E.depthBuffer&&E.resolveDepthBuffer===!1&&(ot.push(F),Ct.push(F),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ct)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ot))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),z)for(let Q=0;Q<c.length;Q++){t.bindFramebuffer(i.FRAMEBUFFER,H.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Q,i.RENDERBUFFER,H.__webglColorRenderbuffer[Q]);const ue=n.get(c[Q]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,H.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Q,i.TEXTURE_2D,ue,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,H.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&u){const c=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[c])}}}function ft(E){return Math.min(s.maxSamples,E.samples)}function Oe(E){const c=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&c.__useRenderToTexture!==!1}function Je(E){const c=a.render.frame;p.get(E)!==c&&(p.set(E,c),E.update())}function ce(E,c){const w=E.colorSpace,D=E.format,k=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||w!==ys&&w!==Ln&&(He.getTransfer(w)===$e?(D!==Kt||k!==zt)&&Pe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Xe("WebGLTextures: Unsupported texture color space:",w)),c}function rt(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(h.width=E.naturalWidth||E.width,h.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(h.width=E.displayWidth,h.height=E.displayHeight):(h.width=E.width,h.height=E.height),h}this.allocateTextureUnit=V,this.resetTextureUnits=Z,this.getTextureUnits=$,this.setTextureUnits=B,this.setTexture2D=ne,this.setTexture2DArray=ie,this.setTexture3D=le,this.setTextureCube=ve,this.rebindTextures=Ze,this.setupRenderTarget=Ue,this.updateRenderTargetMipmap=tt,this.updateMultisampleRenderTarget=N,this.setupDepthRenderbuffer=je,this.setupFrameBufferTexture=we,this.useMultisampledRTT=Oe,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function im(i,e){function t(n,s=Ln){let r;const a=He.getTransfer(s);if(n===zt)return i.UNSIGNED_BYTE;if(n===fa)return i.UNSIGNED_SHORT_4_4_4_4;if(n===pa)return i.UNSIGNED_SHORT_5_5_5_1;if(n===fl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===pl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===hl)return i.BYTE;if(n===dl)return i.SHORT;if(n===Ii)return i.UNSIGNED_SHORT;if(n===da)return i.INT;if(n===ln)return i.UNSIGNED_INT;if(n===sn)return i.FLOAT;if(n===Mn)return i.HALF_FLOAT;if(n===ml)return i.ALPHA;if(n===_l)return i.RGB;if(n===Kt)return i.RGBA;if(n===Sn)return i.DEPTH_COMPONENT;if(n===Wn)return i.DEPTH_STENCIL;if(n===gl)return i.RED;if(n===ma)return i.RED_INTEGER;if(n===Yn)return i.RG;if(n===_a)return i.RG_INTEGER;if(n===ga)return i.RGBA_INTEGER;if(n===_s||n===gs||n===xs||n===vs)if(a===$e)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===_s)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===gs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===xs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===vs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===_s)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===gs)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===xs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===vs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Cr||n===Pr||n===Lr||n===Dr)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Cr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Pr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Lr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Dr)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ir||n===Ur||n===Nr||n===Fr||n===Or||n===Ss||n===Br)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ir||n===Ur)return a===$e?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Nr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Fr)return r.COMPRESSED_R11_EAC;if(n===Or)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ss)return r.COMPRESSED_RG11_EAC;if(n===Br)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===zr||n===Gr||n===Vr||n===Hr||n===kr||n===Wr||n===Xr||n===qr||n===Yr||n===jr||n===Kr||n===Zr||n===$r||n===Jr)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===zr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Gr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Vr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Hr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===kr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Wr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Xr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===qr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Yr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===jr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Kr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Zr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===$r)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Jr)return a===$e?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Qr||n===ea||n===ta)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Qr)return a===$e?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ea)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ta)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===na||n===ia||n===Es||n===sa)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===na)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ia)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Es)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===sa)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ui?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const sm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,rm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class am{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new bl(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new cn({vertexShader:sm,fragmentShader:rm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ct(new Bi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class om extends jn{constructor(e,t){super();const n=this;let s=null,r=1,a=null,o="local-floor",u=1,h=null,p=null,m=null,d=null,_=null,v=null;const S=typeof XRWebGLBinding<"u",f=new am,l={},x=t.getContextAttributes();let y=null,T=null;const P=[],b=[],I=new qe;let g=null;const A=new kt;A.viewport=new dt;const L=new kt;L.viewport=new dt;const C=[A,L],G=new fu;let Z=null,$=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let he=P[J];return he===void 0&&(he=new qs,P[J]=he),he.getTargetRaySpace()},this.getControllerGrip=function(J){let he=P[J];return he===void 0&&(he=new qs,P[J]=he),he.getGripSpace()},this.getHand=function(J){let he=P[J];return he===void 0&&(he=new qs,P[J]=he),he.getHandSpace()};function B(J){const he=b.indexOf(J.inputSource);if(he===-1)return;const ae=P[he];ae!==void 0&&(ae.update(J.inputSource,J.frame,h||a),ae.dispatchEvent({type:J.type,data:J.inputSource}))}function V(){s.removeEventListener("select",B),s.removeEventListener("selectstart",B),s.removeEventListener("selectend",B),s.removeEventListener("squeeze",B),s.removeEventListener("squeezestart",B),s.removeEventListener("squeezeend",B),s.removeEventListener("end",V),s.removeEventListener("inputsourceschange",j);for(let J=0;J<P.length;J++){const he=b[J];he!==null&&(b[J]=null,P[J].disconnect(he))}Z=null,$=null,f.reset();for(const J in l)delete l[J];e.setRenderTarget(y),_=null,d=null,m=null,s=null,T=null,De.stop(),n.isPresenting=!1,e.setPixelRatio(g),e.setSize(I.width,I.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){r=J,n.isPresenting===!0&&Pe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,n.isPresenting===!0&&Pe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return h||a},this.setReferenceSpace=function(J){h=J},this.getBaseLayer=function(){return d!==null?d:_},this.getBinding=function(){return m===null&&S&&(m=new XRWebGLBinding(s,t)),m},this.getFrame=function(){return v},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(y=e.getRenderTarget(),s.addEventListener("select",B),s.addEventListener("selectstart",B),s.addEventListener("selectend",B),s.addEventListener("squeeze",B),s.addEventListener("squeezestart",B),s.addEventListener("squeezeend",B),s.addEventListener("end",V),s.addEventListener("inputsourceschange",j),x.xrCompatible!==!0&&await t.makeXRCompatible(),g=e.getPixelRatio(),e.getSize(I),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let ae=null,ye=null,Le=null;x.depth&&(Le=x.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ae=x.stencil?Wn:Sn,ye=x.stencil?Ui:ln);const we={colorFormat:t.RGBA8,depthFormat:Le,scaleFactor:r};m=this.getBinding(),d=m.createProjectionLayer(we),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),T=new on(d.textureWidth,d.textureHeight,{format:Kt,type:zt,depthTexture:new gi(d.textureWidth,d.textureHeight,ye,void 0,void 0,void 0,void 0,void 0,void 0,ae),stencilBuffer:x.stencil,colorSpace:e.outputColorSpace,samples:x.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const ae={antialias:x.antialias,alpha:!0,depth:x.depth,stencil:x.stencil,framebufferScaleFactor:r};_=new XRWebGLLayer(s,t,ae),s.updateRenderState({baseLayer:_}),e.setPixelRatio(1),e.setSize(_.framebufferWidth,_.framebufferHeight,!1),T=new on(_.framebufferWidth,_.framebufferHeight,{format:Kt,type:zt,colorSpace:e.outputColorSpace,stencilBuffer:x.stencil,resolveDepthBuffer:_.ignoreDepthValues===!1,resolveStencilBuffer:_.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(u),h=null,a=await s.requestReferenceSpace(o),De.setContext(s),De.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return f.getDepthTexture()};function j(J){for(let he=0;he<J.removed.length;he++){const ae=J.removed[he],ye=b.indexOf(ae);ye>=0&&(b[ye]=null,P[ye].disconnect(ae))}for(let he=0;he<J.added.length;he++){const ae=J.added[he];let ye=b.indexOf(ae);if(ye===-1){for(let we=0;we<P.length;we++)if(we>=b.length){b.push(ae),ye=we;break}else if(b[we]===null){b[we]=ae,ye=we;break}if(ye===-1)break}const Le=P[ye];Le&&Le.connect(ae)}}const ne=new U,ie=new U;function le(J,he,ae){ne.setFromMatrixPosition(he.matrixWorld),ie.setFromMatrixPosition(ae.matrixWorld);const ye=ne.distanceTo(ie),Le=he.projectionMatrix.elements,we=ae.projectionMatrix.elements,st=Le[14]/(Le[10]-1),ze=Le[14]/(Le[10]+1),je=(Le[9]+1)/Le[5],Ze=(Le[9]-1)/Le[5],Ue=(Le[8]-1)/Le[0],tt=(we[8]+1)/we[0],ot=st*Ue,Ct=st*tt,N=ye/(-Ue+tt),ft=N*-Ue;if(he.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX(ft),J.translateZ(N),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),Le[10]===-1)J.projectionMatrix.copy(he.projectionMatrix),J.projectionMatrixInverse.copy(he.projectionMatrixInverse);else{const Oe=st+N,Je=ze+N,ce=ot-ft,rt=Ct+(ye-ft),E=je*ze/Je*Oe,c=Ze*ze/Je*Oe;J.projectionMatrix.makePerspective(ce,rt,E,c,Oe,Je),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function ve(J,he){he===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(he.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let he=J.near,ae=J.far;f.texture!==null&&(f.depthNear>0&&(he=f.depthNear),f.depthFar>0&&(ae=f.depthFar)),G.near=L.near=A.near=he,G.far=L.far=A.far=ae,(Z!==G.near||$!==G.far)&&(s.updateRenderState({depthNear:G.near,depthFar:G.far}),Z=G.near,$=G.far),G.layers.mask=J.layers.mask|6,A.layers.mask=G.layers.mask&-5,L.layers.mask=G.layers.mask&-3;const ye=J.parent,Le=G.cameras;ve(G,ye);for(let we=0;we<Le.length;we++)ve(Le[we],ye);Le.length===2?le(G,A,L):G.projectionMatrix.copy(A.projectionMatrix),Te(J,G,ye)};function Te(J,he,ae){ae===null?J.matrix.copy(he.matrixWorld):(J.matrix.copy(ae.matrixWorld),J.matrix.invert(),J.matrix.multiply(he.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(he.projectionMatrix),J.projectionMatrixInverse.copy(he.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=oa*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return G},this.getFoveation=function(){if(!(d===null&&_===null))return u},this.setFoveation=function(J){u=J,d!==null&&(d.fixedFoveation=J),_!==null&&_.fixedFoveation!==void 0&&(_.fixedFoveation=J)},this.hasDepthSensing=function(){return f.texture!==null},this.getDepthSensingMesh=function(){return f.getMesh(G)},this.getCameraTexture=function(J){return l[J]};let Ve=null;function Ke(J,he){if(p=he.getViewerPose(h||a),v=he,p!==null){const ae=p.views;_!==null&&(e.setRenderTargetFramebuffer(T,_.framebuffer),e.setRenderTarget(T));let ye=!1;ae.length!==G.cameras.length&&(G.cameras.length=0,ye=!0);for(let ze=0;ze<ae.length;ze++){const je=ae[ze];let Ze=null;if(_!==null)Ze=_.getViewport(je);else{const tt=m.getViewSubImage(d,je);Ze=tt.viewport,ze===0&&(e.setRenderTargetTextures(T,tt.colorTexture,tt.depthStencilTexture),e.setRenderTarget(T))}let Ue=C[ze];Ue===void 0&&(Ue=new kt,Ue.layers.enable(ze),Ue.viewport=new dt,C[ze]=Ue),Ue.matrix.fromArray(je.transform.matrix),Ue.matrix.decompose(Ue.position,Ue.quaternion,Ue.scale),Ue.projectionMatrix.fromArray(je.projectionMatrix),Ue.projectionMatrixInverse.copy(Ue.projectionMatrix).invert(),Ue.viewport.set(Ze.x,Ze.y,Ze.width,Ze.height),ze===0&&(G.matrix.copy(Ue.matrix),G.matrix.decompose(G.position,G.quaternion,G.scale)),ye===!0&&G.cameras.push(Ue)}const Le=s.enabledFeatures;if(Le&&Le.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){m=n.getBinding();const ze=m.getDepthInformation(ae[0]);ze&&ze.isValid&&ze.texture&&f.init(ze,s.renderState)}if(Le&&Le.includes("camera-access")&&S){e.state.unbindTexture(),m=n.getBinding();for(let ze=0;ze<ae.length;ze++){const je=ae[ze].camera;if(je){let Ze=l[je];Ze||(Ze=new bl,l[je]=Ze);const Ue=m.getCameraImage(je);Ze.sourceTexture=Ue}}}}for(let ae=0;ae<P.length;ae++){const ye=b[ae],Le=P[ae];ye!==null&&Le!==void 0&&Le.update(ye,he,h||a)}Ve&&Ve(J,he),he.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:he}),v=null}const De=new Cl;De.setAnimationLoop(Ke),this.setAnimationLoop=function(J){Ve=J},this.dispose=function(){}}}const lm=new ut,Fl=new Ie;Fl.set(-1,0,0,0,1,0,0,0,1);function cm(i,e){function t(f,l){f.matrixAutoUpdate===!0&&f.updateMatrix(),l.value.copy(f.matrix)}function n(f,l){l.color.getRGB(f.fogColor.value,Al(i)),l.isFog?(f.fogNear.value=l.near,f.fogFar.value=l.far):l.isFogExp2&&(f.fogDensity.value=l.density)}function s(f,l,x,y,T){l.isNodeMaterial?l.uniformsNeedUpdate=!1:l.isMeshBasicMaterial?r(f,l):l.isMeshLambertMaterial?(r(f,l),l.envMap&&(f.envMapIntensity.value=l.envMapIntensity)):l.isMeshToonMaterial?(r(f,l),m(f,l)):l.isMeshPhongMaterial?(r(f,l),p(f,l),l.envMap&&(f.envMapIntensity.value=l.envMapIntensity)):l.isMeshStandardMaterial?(r(f,l),d(f,l),l.isMeshPhysicalMaterial&&_(f,l,T)):l.isMeshMatcapMaterial?(r(f,l),v(f,l)):l.isMeshDepthMaterial?r(f,l):l.isMeshDistanceMaterial?(r(f,l),S(f,l)):l.isMeshNormalMaterial?r(f,l):l.isLineBasicMaterial?(a(f,l),l.isLineDashedMaterial&&o(f,l)):l.isPointsMaterial?u(f,l,x,y):l.isSpriteMaterial?h(f,l):l.isShadowMaterial?(f.color.value.copy(l.color),f.opacity.value=l.opacity):l.isShaderMaterial&&(l.uniformsNeedUpdate=!1)}function r(f,l){f.opacity.value=l.opacity,l.color&&f.diffuse.value.copy(l.color),l.emissive&&f.emissive.value.copy(l.emissive).multiplyScalar(l.emissiveIntensity),l.map&&(f.map.value=l.map,t(l.map,f.mapTransform)),l.alphaMap&&(f.alphaMap.value=l.alphaMap,t(l.alphaMap,f.alphaMapTransform)),l.bumpMap&&(f.bumpMap.value=l.bumpMap,t(l.bumpMap,f.bumpMapTransform),f.bumpScale.value=l.bumpScale,l.side===It&&(f.bumpScale.value*=-1)),l.normalMap&&(f.normalMap.value=l.normalMap,t(l.normalMap,f.normalMapTransform),f.normalScale.value.copy(l.normalScale),l.side===It&&f.normalScale.value.negate()),l.displacementMap&&(f.displacementMap.value=l.displacementMap,t(l.displacementMap,f.displacementMapTransform),f.displacementScale.value=l.displacementScale,f.displacementBias.value=l.displacementBias),l.emissiveMap&&(f.emissiveMap.value=l.emissiveMap,t(l.emissiveMap,f.emissiveMapTransform)),l.specularMap&&(f.specularMap.value=l.specularMap,t(l.specularMap,f.specularMapTransform)),l.alphaTest>0&&(f.alphaTest.value=l.alphaTest);const x=e.get(l),y=x.envMap,T=x.envMapRotation;y&&(f.envMap.value=y,f.envMapRotation.value.setFromMatrix4(lm.makeRotationFromEuler(T)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&f.envMapRotation.value.premultiply(Fl),f.reflectivity.value=l.reflectivity,f.ior.value=l.ior,f.refractionRatio.value=l.refractionRatio),l.lightMap&&(f.lightMap.value=l.lightMap,f.lightMapIntensity.value=l.lightMapIntensity,t(l.lightMap,f.lightMapTransform)),l.aoMap&&(f.aoMap.value=l.aoMap,f.aoMapIntensity.value=l.aoMapIntensity,t(l.aoMap,f.aoMapTransform))}function a(f,l){f.diffuse.value.copy(l.color),f.opacity.value=l.opacity,l.map&&(f.map.value=l.map,t(l.map,f.mapTransform))}function o(f,l){f.dashSize.value=l.dashSize,f.totalSize.value=l.dashSize+l.gapSize,f.scale.value=l.scale}function u(f,l,x,y){f.diffuse.value.copy(l.color),f.opacity.value=l.opacity,f.size.value=l.size*x,f.scale.value=y*.5,l.map&&(f.map.value=l.map,t(l.map,f.uvTransform)),l.alphaMap&&(f.alphaMap.value=l.alphaMap,t(l.alphaMap,f.alphaMapTransform)),l.alphaTest>0&&(f.alphaTest.value=l.alphaTest)}function h(f,l){f.diffuse.value.copy(l.color),f.opacity.value=l.opacity,f.rotation.value=l.rotation,l.map&&(f.map.value=l.map,t(l.map,f.mapTransform)),l.alphaMap&&(f.alphaMap.value=l.alphaMap,t(l.alphaMap,f.alphaMapTransform)),l.alphaTest>0&&(f.alphaTest.value=l.alphaTest)}function p(f,l){f.specular.value.copy(l.specular),f.shininess.value=Math.max(l.shininess,1e-4)}function m(f,l){l.gradientMap&&(f.gradientMap.value=l.gradientMap)}function d(f,l){f.metalness.value=l.metalness,l.metalnessMap&&(f.metalnessMap.value=l.metalnessMap,t(l.metalnessMap,f.metalnessMapTransform)),f.roughness.value=l.roughness,l.roughnessMap&&(f.roughnessMap.value=l.roughnessMap,t(l.roughnessMap,f.roughnessMapTransform)),l.envMap&&(f.envMapIntensity.value=l.envMapIntensity)}function _(f,l,x){f.ior.value=l.ior,l.sheen>0&&(f.sheenColor.value.copy(l.sheenColor).multiplyScalar(l.sheen),f.sheenRoughness.value=l.sheenRoughness,l.sheenColorMap&&(f.sheenColorMap.value=l.sheenColorMap,t(l.sheenColorMap,f.sheenColorMapTransform)),l.sheenRoughnessMap&&(f.sheenRoughnessMap.value=l.sheenRoughnessMap,t(l.sheenRoughnessMap,f.sheenRoughnessMapTransform))),l.clearcoat>0&&(f.clearcoat.value=l.clearcoat,f.clearcoatRoughness.value=l.clearcoatRoughness,l.clearcoatMap&&(f.clearcoatMap.value=l.clearcoatMap,t(l.clearcoatMap,f.clearcoatMapTransform)),l.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=l.clearcoatRoughnessMap,t(l.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),l.clearcoatNormalMap&&(f.clearcoatNormalMap.value=l.clearcoatNormalMap,t(l.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(l.clearcoatNormalScale),l.side===It&&f.clearcoatNormalScale.value.negate())),l.dispersion>0&&(f.dispersion.value=l.dispersion),l.iridescence>0&&(f.iridescence.value=l.iridescence,f.iridescenceIOR.value=l.iridescenceIOR,f.iridescenceThicknessMinimum.value=l.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=l.iridescenceThicknessRange[1],l.iridescenceMap&&(f.iridescenceMap.value=l.iridescenceMap,t(l.iridescenceMap,f.iridescenceMapTransform)),l.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=l.iridescenceThicknessMap,t(l.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),l.transmission>0&&(f.transmission.value=l.transmission,f.transmissionSamplerMap.value=x.texture,f.transmissionSamplerSize.value.set(x.width,x.height),l.transmissionMap&&(f.transmissionMap.value=l.transmissionMap,t(l.transmissionMap,f.transmissionMapTransform)),f.thickness.value=l.thickness,l.thicknessMap&&(f.thicknessMap.value=l.thicknessMap,t(l.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=l.attenuationDistance,f.attenuationColor.value.copy(l.attenuationColor)),l.anisotropy>0&&(f.anisotropyVector.value.set(l.anisotropy*Math.cos(l.anisotropyRotation),l.anisotropy*Math.sin(l.anisotropyRotation)),l.anisotropyMap&&(f.anisotropyMap.value=l.anisotropyMap,t(l.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=l.specularIntensity,f.specularColor.value.copy(l.specularColor),l.specularColorMap&&(f.specularColorMap.value=l.specularColorMap,t(l.specularColorMap,f.specularColorMapTransform)),l.specularIntensityMap&&(f.specularIntensityMap.value=l.specularIntensityMap,t(l.specularIntensityMap,f.specularIntensityMapTransform))}function v(f,l){l.matcap&&(f.matcap.value=l.matcap)}function S(f,l){const x=e.get(l).light;f.referencePosition.value.setFromMatrixPosition(x.matrixWorld),f.nearDistance.value=x.shadow.camera.near,f.farDistance.value=x.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function um(i,e,t,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function u(x,y){const T=y.program;n.uniformBlockBinding(x,T)}function h(x,y){let T=s[x.id];T===void 0&&(v(x),T=p(x),s[x.id]=T,x.addEventListener("dispose",f));const P=y.program;n.updateUBOMapping(x,P);const b=e.render.frame;r[x.id]!==b&&(d(x),r[x.id]=b)}function p(x){const y=m();x.__bindingPointIndex=y;const T=i.createBuffer(),P=x.__size,b=x.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,P,b),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,y,T),T}function m(){for(let x=0;x<o;x++)if(a.indexOf(x)===-1)return a.push(x),x;return Xe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(x){const y=s[x.id],T=x.uniforms,P=x.__cache;i.bindBuffer(i.UNIFORM_BUFFER,y);for(let b=0,I=T.length;b<I;b++){const g=Array.isArray(T[b])?T[b]:[T[b]];for(let A=0,L=g.length;A<L;A++){const C=g[A];if(_(C,b,A,P)===!0){const G=C.__offset,Z=Array.isArray(C.value)?C.value:[C.value];let $=0;for(let B=0;B<Z.length;B++){const V=Z[B],j=S(V);typeof V=="number"||typeof V=="boolean"?(C.__data[0]=V,i.bufferSubData(i.UNIFORM_BUFFER,G+$,C.__data)):V.isMatrix3?(C.__data[0]=V.elements[0],C.__data[1]=V.elements[1],C.__data[2]=V.elements[2],C.__data[3]=0,C.__data[4]=V.elements[3],C.__data[5]=V.elements[4],C.__data[6]=V.elements[5],C.__data[7]=0,C.__data[8]=V.elements[6],C.__data[9]=V.elements[7],C.__data[10]=V.elements[8],C.__data[11]=0):ArrayBuffer.isView(V)?C.__data.set(new V.constructor(V.buffer,V.byteOffset,C.__data.length)):(V.toArray(C.__data,$),$+=j.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,G,C.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function _(x,y,T,P){const b=x.value,I=y+"_"+T;if(P[I]===void 0)return typeof b=="number"||typeof b=="boolean"?P[I]=b:ArrayBuffer.isView(b)?P[I]=b.slice():P[I]=b.clone(),!0;{const g=P[I];if(typeof b=="number"||typeof b=="boolean"){if(g!==b)return P[I]=b,!0}else{if(ArrayBuffer.isView(b))return!0;if(g.equals(b)===!1)return g.copy(b),!0}}return!1}function v(x){const y=x.uniforms;let T=0;const P=16;for(let I=0,g=y.length;I<g;I++){const A=Array.isArray(y[I])?y[I]:[y[I]];for(let L=0,C=A.length;L<C;L++){const G=A[L],Z=Array.isArray(G.value)?G.value:[G.value];for(let $=0,B=Z.length;$<B;$++){const V=Z[$],j=S(V),ne=T%P,ie=ne%j.boundary,le=ne+ie;T+=ie,le!==0&&P-le<j.storage&&(T+=P-le),G.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=T,T+=j.storage}}}const b=T%P;return b>0&&(T+=P-b),x.__size=T,x.__cache={},this}function S(x){const y={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(y.boundary=4,y.storage=4):x.isVector2?(y.boundary=8,y.storage=8):x.isVector3||x.isColor?(y.boundary=16,y.storage=12):x.isVector4?(y.boundary=16,y.storage=16):x.isMatrix3?(y.boundary=48,y.storage=48):x.isMatrix4?(y.boundary=64,y.storage=64):x.isTexture?Pe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(y.boundary=16,y.storage=x.byteLength):Pe("WebGLRenderer: Unsupported uniform value type.",x),y}function f(x){const y=x.target;y.removeEventListener("dispose",f);const T=a.indexOf(y.__bindingPointIndex);a.splice(T,1),i.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function l(){for(const x in s)i.deleteBuffer(s[x]);a=[],s={},r={}}return{bind:u,update:h,dispose:l}}const hm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Qt=null;function dm(){return Qt===null&&(Qt=new Kc(hm,16,16,Yn,Mn),Qt.name="DFG_LUT",Qt.minFilter=Rt,Qt.magFilter=Rt,Qt.wrapS=gn,Qt.wrapT=gn,Qt.generateMipmaps=!1,Qt.needsUpdate=!0),Qt}class fm{constructor(e={}){const{canvas:t=Ac(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:u=!0,preserveDrawingBuffer:h=!1,powerPreference:p="default",failIfMajorPerformanceCaveat:m=!1,reversedDepthBuffer:d=!1,outputBufferType:_=zt}=e;this.isWebGLRenderer=!0;let v;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");v=n.getContextAttributes().alpha}else v=a;const S=_,f=new Set([ga,_a,ma]),l=new Set([zt,ln,Ii,Ui,fa,pa]),x=new Uint32Array(4),y=new Int32Array(4),T=new U;let P=null,b=null;const I=[],g=[];let A=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=an,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const L=this;let C=!1,G=null;this._outputColorSpace=Ht;let Z=0,$=0,B=null,V=-1,j=null;const ne=new dt,ie=new dt;let le=null;const ve=new We(0);let Te=0,Ve=t.width,Ke=t.height,De=1,J=null,he=null;const ae=new dt(0,0,Ve,Ke),ye=new dt(0,0,Ve,Ke);let Le=!1;const we=new ba;let st=!1,ze=!1;const je=new ut,Ze=new U,Ue=new dt,tt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ot=!1;function Ct(){return B===null?De:1}let N=n;function ft(M,O){return t.getContext(M,O)}try{const M={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:u,preserveDrawingBuffer:h,powerPreference:p,failIfMajorPerformanceCaveat:m};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${ha}`),t.addEventListener("webglcontextlost",ee,!1),t.addEventListener("webglcontextrestored",Me,!1),t.addEventListener("webglcontextcreationerror",Ne,!1),N===null){const O="webgl2";if(N=ft(O,M),N===null)throw ft(O)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw Xe("WebGLRenderer: "+M.message),M}let Oe,Je,ce,rt,E,c,w,D,k,F,H,z,q,Q,ue,se,re,Ce,de,Re,R,te,K;function me(){Oe=new df(N),Oe.init(),R=new im(N,Oe),Je=new sf(N,Oe,e,R),ce=new tm(N,Oe),Je.reversedDepthBuffer&&d&&ce.buffers.depth.setReversed(!0),rt=new mf(N),E=new Vp,c=new nm(N,Oe,ce,E,Je,R,rt),w=new hf(L),D=new xu(N),te=new tf(N,D),k=new ff(N,D,rt,te),F=new gf(N,k,D,te,rt),Ce=new _f(N,Je,c),ue=new rf(E),H=new Gp(L,w,Oe,Je,te,ue),z=new cm(L,E),q=new kp,Q=new Kp(Oe),re=new ef(L,w,ce,F,v,u),se=new em(L,F,Je),K=new um(N,rt,Je,ce),de=new nf(N,Oe,rt),Re=new pf(N,Oe,rt),rt.programs=H.programs,L.capabilities=Je,L.extensions=Oe,L.properties=E,L.renderLists=q,L.shadowMap=se,L.state=ce,L.info=rt}me(),S!==zt&&(A=new vf(S,t.width,t.height,s,r));const oe=new om(L,N);this.xr=oe,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const M=Oe.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Oe.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return De},this.setPixelRatio=function(M){M!==void 0&&(De=M,this.setSize(Ve,Ke,!1))},this.getSize=function(M){return M.set(Ve,Ke)},this.setSize=function(M,O,Y=!0){if(oe.isPresenting){Pe("WebGLRenderer: Can't change size while VR device is presenting.");return}Ve=M,Ke=O,t.width=Math.floor(M*De),t.height=Math.floor(O*De),Y===!0&&(t.style.width=M+"px",t.style.height=O+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,M,O)},this.getDrawingBufferSize=function(M){return M.set(Ve*De,Ke*De).floor()},this.setDrawingBufferSize=function(M,O,Y){Ve=M,Ke=O,De=Y,t.width=Math.floor(M*Y),t.height=Math.floor(O*Y),this.setViewport(0,0,M,O)},this.setEffects=function(M){if(S===zt){Xe("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let O=0;O<M.length;O++)if(M[O].isOutputPass===!0){Pe("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(ne)},this.getViewport=function(M){return M.copy(ae)},this.setViewport=function(M,O,Y,W){M.isVector4?ae.set(M.x,M.y,M.z,M.w):ae.set(M,O,Y,W),ce.viewport(ne.copy(ae).multiplyScalar(De).round())},this.getScissor=function(M){return M.copy(ye)},this.setScissor=function(M,O,Y,W){M.isVector4?ye.set(M.x,M.y,M.z,M.w):ye.set(M,O,Y,W),ce.scissor(ie.copy(ye).multiplyScalar(De).round())},this.getScissorTest=function(){return Le},this.setScissorTest=function(M){ce.setScissorTest(Le=M)},this.setOpaqueSort=function(M){J=M},this.setTransparentSort=function(M){he=M},this.getClearColor=function(M){return M.copy(re.getClearColor())},this.setClearColor=function(){re.setClearColor(...arguments)},this.getClearAlpha=function(){return re.getClearAlpha()},this.setClearAlpha=function(){re.setClearAlpha(...arguments)},this.clear=function(M=!0,O=!0,Y=!0){let W=0;if(M){let X=!1;if(B!==null){const _e=B.texture.format;X=f.has(_e)}if(X){const _e=B.texture.type,xe=l.has(_e),pe=re.getClearColor(),Se=re.getClearAlpha(),be=pe.r,Fe=pe.g,Ge=pe.b;xe?(x[0]=be,x[1]=Fe,x[2]=Ge,x[3]=Se,N.clearBufferuiv(N.COLOR,0,x)):(y[0]=be,y[1]=Fe,y[2]=Ge,y[3]=Se,N.clearBufferiv(N.COLOR,0,y))}else W|=N.COLOR_BUFFER_BIT}O&&(W|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Y&&(W|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),W!==0&&N.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),G=M},this.dispose=function(){t.removeEventListener("webglcontextlost",ee,!1),t.removeEventListener("webglcontextrestored",Me,!1),t.removeEventListener("webglcontextcreationerror",Ne,!1),re.dispose(),q.dispose(),Q.dispose(),E.dispose(),w.dispose(),F.dispose(),te.dispose(),K.dispose(),H.dispose(),oe.dispose(),oe.removeEventListener("sessionstart",Oa),oe.removeEventListener("sessionend",Ba),Nn.stop()};function ee(M){M.preventDefault(),Qa("WebGLRenderer: Context Lost."),C=!0}function Me(){Qa("WebGLRenderer: Context Restored."),C=!1;const M=rt.autoReset,O=se.enabled,Y=se.autoUpdate,W=se.needsUpdate,X=se.type;me(),rt.autoReset=M,se.enabled=O,se.autoUpdate=Y,se.needsUpdate=W,se.type=X}function Ne(M){Xe("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function pt(M){const O=M.target;O.removeEventListener("dispose",pt),Qe(O)}function Qe(M){un(M),E.remove(M)}function un(M){const O=E.get(M).programs;O!==void 0&&(O.forEach(function(Y){H.releaseProgram(Y)}),M.isShaderMaterial&&H.releaseShaderCache(M))}this.renderBufferDirect=function(M,O,Y,W,X,_e){O===null&&(O=tt);const xe=X.isMesh&&X.matrixWorld.determinant()<0,pe=Gl(M,O,Y,W,X);ce.setMaterial(W,xe);let Se=Y.index,be=1;if(W.wireframe===!0){if(Se=k.getWireframeAttribute(Y),Se===void 0)return;be=2}const Fe=Y.drawRange,Ge=Y.attributes.position;let Ae=Fe.start*be,et=(Fe.start+Fe.count)*be;_e!==null&&(Ae=Math.max(Ae,_e.start*be),et=Math.min(et,(_e.start+_e.count)*be)),Se!==null?(Ae=Math.max(Ae,0),et=Math.min(et,Se.count)):Ge!=null&&(Ae=Math.max(Ae,0),et=Math.min(et,Ge.count));const mt=et-Ae;if(mt<0||mt===1/0)return;te.setup(X,W,pe,Y,Se);let ht,nt=de;if(Se!==null&&(ht=D.get(Se),nt=Re,nt.setIndex(ht)),X.isMesh)W.wireframe===!0?(ce.setLineWidth(W.wireframeLinewidth*Ct()),nt.setMode(N.LINES)):nt.setMode(N.TRIANGLES);else if(X.isLine){let bt=W.linewidth;bt===void 0&&(bt=1),ce.setLineWidth(bt*Ct()),X.isLineSegments?nt.setMode(N.LINES):X.isLineLoop?nt.setMode(N.LINE_LOOP):nt.setMode(N.LINE_STRIP)}else X.isPoints?nt.setMode(N.POINTS):X.isSprite&&nt.setMode(N.TRIANGLES);if(X.isBatchedMesh)if(Oe.get("WEBGL_multi_draw"))nt.renderMultiDraw(X._multiDrawStarts,X._multiDrawCounts,X._multiDrawCount);else{const bt=X._multiDrawStarts,ge=X._multiDrawCounts,Ut=X._multiDrawCount,Ye=Se?D.get(Se).bytesPerElement:1,Gt=E.get(W).currentProgram.getUniforms();for(let $t=0;$t<Ut;$t++)Gt.setValue(N,"_gl_DrawID",$t),nt.render(bt[$t]/Ye,ge[$t])}else if(X.isInstancedMesh)nt.renderInstances(Ae,mt,X.count);else if(Y.isInstancedBufferGeometry){const bt=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,ge=Math.min(Y.instanceCount,bt);nt.renderInstances(Ae,mt,ge)}else nt.render(Ae,mt)};function Zt(M,O,Y){M.transparent===!0&&M.side===_n&&M.forceSinglePass===!1?(M.side=It,M.needsUpdate=!0,Gi(M,O,Y),M.side=In,M.needsUpdate=!0,Gi(M,O,Y),M.side=_n):Gi(M,O,Y)}this.compile=function(M,O,Y=null){Y===null&&(Y=M),b=Q.get(Y),b.init(O),g.push(b),Y.traverseVisible(function(X){X.isLight&&X.layers.test(O.layers)&&(b.pushLight(X),X.castShadow&&b.pushShadow(X))}),M!==Y&&M.traverseVisible(function(X){X.isLight&&X.layers.test(O.layers)&&(b.pushLight(X),X.castShadow&&b.pushShadow(X))}),b.setupLights();const W=new Set;return M.traverse(function(X){if(!(X.isMesh||X.isPoints||X.isLine||X.isSprite))return;const _e=X.material;if(_e)if(Array.isArray(_e))for(let xe=0;xe<_e.length;xe++){const pe=_e[xe];Zt(pe,Y,X),W.add(pe)}else Zt(_e,Y,X),W.add(_e)}),b=g.pop(),W},this.compileAsync=function(M,O,Y=null){const W=this.compile(M,O,Y);return new Promise(X=>{function _e(){if(W.forEach(function(xe){E.get(xe).currentProgram.isReady()&&W.delete(xe)}),W.size===0){X(M);return}setTimeout(_e,10)}Oe.get("KHR_parallel_shader_compile")!==null?_e():setTimeout(_e,10)})};let Is=null;function Bl(M){Is&&Is(M)}function Oa(){Nn.stop()}function Ba(){Nn.start()}const Nn=new Cl;Nn.setAnimationLoop(Bl),typeof self<"u"&&Nn.setContext(self),this.setAnimationLoop=function(M){Is=M,oe.setAnimationLoop(M),M===null?Nn.stop():Nn.start()},oe.addEventListener("sessionstart",Oa),oe.addEventListener("sessionend",Ba),this.render=function(M,O){if(O!==void 0&&O.isCamera!==!0){Xe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;G!==null&&G.renderStart(M,O);const Y=oe.enabled===!0&&oe.isPresenting===!0,W=A!==null&&(B===null||Y)&&A.begin(L,B);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),oe.enabled===!0&&oe.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(oe.cameraAutoUpdate===!0&&oe.updateCamera(O),O=oe.getCamera()),M.isScene===!0&&M.onBeforeRender(L,M,O,B),b=Q.get(M,g.length),b.init(O),b.state.textureUnits=c.getTextureUnits(),g.push(b),je.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),we.setFromProjectionMatrix(je,rn,O.reversedDepth),ze=this.localClippingEnabled,st=ue.init(this.clippingPlanes,ze),P=q.get(M,I.length),P.init(),I.push(P),oe.enabled===!0&&oe.isPresenting===!0){const xe=L.xr.getDepthSensingMesh();xe!==null&&Us(xe,O,-1/0,L.sortObjects)}Us(M,O,0,L.sortObjects),P.finish(),L.sortObjects===!0&&P.sort(J,he),ot=oe.enabled===!1||oe.isPresenting===!1||oe.hasDepthSensing()===!1,ot&&re.addToRenderList(P,M),this.info.render.frame++,st===!0&&ue.beginShadows();const X=b.state.shadowsArray;if(se.render(X,M,O),st===!0&&ue.endShadows(),this.info.autoReset===!0&&this.info.reset(),(W&&A.hasRenderPass())===!1){const xe=P.opaque,pe=P.transmissive;if(b.setupLights(),O.isArrayCamera){const Se=O.cameras;if(pe.length>0)for(let be=0,Fe=Se.length;be<Fe;be++){const Ge=Se[be];Ga(xe,pe,M,Ge)}ot&&re.render(M);for(let be=0,Fe=Se.length;be<Fe;be++){const Ge=Se[be];za(P,M,Ge,Ge.viewport)}}else pe.length>0&&Ga(xe,pe,M,O),ot&&re.render(M),za(P,M,O)}B!==null&&$===0&&(c.updateMultisampleRenderTarget(B),c.updateRenderTargetMipmap(B)),W&&A.end(L),M.isScene===!0&&M.onAfterRender(L,M,O),te.resetDefaultState(),V=-1,j=null,g.pop(),g.length>0?(b=g[g.length-1],c.setTextureUnits(b.state.textureUnits),st===!0&&ue.setGlobalState(L.clippingPlanes,b.state.camera)):b=null,I.pop(),I.length>0?P=I[I.length-1]:P=null,G!==null&&G.renderEnd()};function Us(M,O,Y,W){if(M.visible===!1)return;if(M.layers.test(O.layers)){if(M.isGroup)Y=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(O);else if(M.isLightProbeGrid)b.pushLightProbeGrid(M);else if(M.isLight)b.pushLight(M),M.castShadow&&b.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||we.intersectsSprite(M)){W&&Ue.setFromMatrixPosition(M.matrixWorld).applyMatrix4(je);const xe=F.update(M),pe=M.material;pe.visible&&P.push(M,xe,pe,Y,Ue.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||we.intersectsObject(M))){const xe=F.update(M),pe=M.material;if(W&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ue.copy(M.boundingSphere.center)):(xe.boundingSphere===null&&xe.computeBoundingSphere(),Ue.copy(xe.boundingSphere.center)),Ue.applyMatrix4(M.matrixWorld).applyMatrix4(je)),Array.isArray(pe)){const Se=xe.groups;for(let be=0,Fe=Se.length;be<Fe;be++){const Ge=Se[be],Ae=pe[Ge.materialIndex];Ae&&Ae.visible&&P.push(M,xe,Ae,Y,Ue.z,Ge)}}else pe.visible&&P.push(M,xe,pe,Y,Ue.z,null)}}const _e=M.children;for(let xe=0,pe=_e.length;xe<pe;xe++)Us(_e[xe],O,Y,W)}function za(M,O,Y,W){const{opaque:X,transmissive:_e,transparent:xe}=M;b.setupLightsView(Y),st===!0&&ue.setGlobalState(L.clippingPlanes,Y),W&&ce.viewport(ne.copy(W)),X.length>0&&zi(X,O,Y),_e.length>0&&zi(_e,O,Y),xe.length>0&&zi(xe,O,Y),ce.buffers.depth.setTest(!0),ce.buffers.depth.setMask(!0),ce.buffers.color.setMask(!0),ce.setPolygonOffset(!1)}function Ga(M,O,Y,W){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[W.id]===void 0){const Ae=Oe.has("EXT_color_buffer_half_float")||Oe.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[W.id]=new on(1,1,{generateMipmaps:!0,type:Ae?Mn:zt,minFilter:kn,samples:Math.max(4,Je.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:He.workingColorSpace})}const _e=b.state.transmissionRenderTarget[W.id],xe=W.viewport||ne;_e.setSize(xe.z*L.transmissionResolutionScale,xe.w*L.transmissionResolutionScale);const pe=L.getRenderTarget(),Se=L.getActiveCubeFace(),be=L.getActiveMipmapLevel();L.setRenderTarget(_e),L.getClearColor(ve),Te=L.getClearAlpha(),Te<1&&L.setClearColor(16777215,.5),L.clear(),ot&&re.render(Y);const Fe=L.toneMapping;L.toneMapping=an;const Ge=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),b.setupLightsView(W),st===!0&&ue.setGlobalState(L.clippingPlanes,W),zi(M,Y,W),c.updateMultisampleRenderTarget(_e),c.updateRenderTargetMipmap(_e),Oe.has("WEBGL_multisampled_render_to_texture")===!1){let Ae=!1;for(let et=0,mt=O.length;et<mt;et++){const ht=O[et],{object:nt,geometry:bt,material:ge,group:Ut}=ht;if(ge.side===_n&&nt.layers.test(W.layers)){const Ye=ge.side;ge.side=It,ge.needsUpdate=!0,Va(nt,Y,W,bt,ge,Ut),ge.side=Ye,ge.needsUpdate=!0,Ae=!0}}Ae===!0&&(c.updateMultisampleRenderTarget(_e),c.updateRenderTargetMipmap(_e))}L.setRenderTarget(pe,Se,be),L.setClearColor(ve,Te),Ge!==void 0&&(W.viewport=Ge),L.toneMapping=Fe}function zi(M,O,Y){const W=O.isScene===!0?O.overrideMaterial:null;for(let X=0,_e=M.length;X<_e;X++){const xe=M[X],{object:pe,geometry:Se,group:be}=xe;let Fe=xe.material;Fe.allowOverride===!0&&W!==null&&(Fe=W),pe.layers.test(Y.layers)&&Va(pe,O,Y,Se,Fe,be)}}function Va(M,O,Y,W,X,_e){M.onBeforeRender(L,O,Y,W,X,_e),M.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),X.onBeforeRender(L,O,Y,W,M,_e),X.transparent===!0&&X.side===_n&&X.forceSinglePass===!1?(X.side=It,X.needsUpdate=!0,L.renderBufferDirect(Y,O,W,X,M,_e),X.side=In,X.needsUpdate=!0,L.renderBufferDirect(Y,O,W,X,M,_e),X.side=_n):L.renderBufferDirect(Y,O,W,X,M,_e),M.onAfterRender(L,O,Y,W,X,_e)}function Gi(M,O,Y){O.isScene!==!0&&(O=tt);const W=E.get(M),X=b.state.lights,_e=b.state.shadowsArray,xe=X.state.version,pe=H.getParameters(M,X.state,_e,O,Y,b.state.lightProbeGridArray),Se=H.getProgramCacheKey(pe);let be=W.programs;W.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?O.environment:null,W.fog=O.fog;const Fe=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;W.envMap=w.get(M.envMap||W.environment,Fe),W.envMapRotation=W.environment!==null&&M.envMap===null?O.environmentRotation:M.envMapRotation,be===void 0&&(M.addEventListener("dispose",pt),be=new Map,W.programs=be);let Ge=be.get(Se);if(Ge!==void 0){if(W.currentProgram===Ge&&W.lightsStateVersion===xe)return ka(M,pe),Ge}else pe.uniforms=H.getUniforms(M),G!==null&&M.isNodeMaterial&&G.build(M,Y,pe),M.onBeforeCompile(pe,L),Ge=H.acquireProgram(pe,Se),be.set(Se,Ge),W.uniforms=pe.uniforms;const Ae=W.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ae.clippingPlanes=ue.uniform),ka(M,pe),W.needsLights=Hl(M),W.lightsStateVersion=xe,W.needsLights&&(Ae.ambientLightColor.value=X.state.ambient,Ae.lightProbe.value=X.state.probe,Ae.directionalLights.value=X.state.directional,Ae.directionalLightShadows.value=X.state.directionalShadow,Ae.spotLights.value=X.state.spot,Ae.spotLightShadows.value=X.state.spotShadow,Ae.rectAreaLights.value=X.state.rectArea,Ae.ltc_1.value=X.state.rectAreaLTC1,Ae.ltc_2.value=X.state.rectAreaLTC2,Ae.pointLights.value=X.state.point,Ae.pointLightShadows.value=X.state.pointShadow,Ae.hemisphereLights.value=X.state.hemi,Ae.directionalShadowMatrix.value=X.state.directionalShadowMatrix,Ae.spotLightMatrix.value=X.state.spotLightMatrix,Ae.spotLightMap.value=X.state.spotLightMap,Ae.pointShadowMatrix.value=X.state.pointShadowMatrix),W.lightProbeGrid=b.state.lightProbeGridArray.length>0,W.currentProgram=Ge,W.uniformsList=null,Ge}function Ha(M){if(M.uniformsList===null){const O=M.currentProgram.getUniforms();M.uniformsList=Ms.seqWithValue(O.seq,M.uniforms)}return M.uniformsList}function ka(M,O){const Y=E.get(M);Y.outputColorSpace=O.outputColorSpace,Y.batching=O.batching,Y.batchingColor=O.batchingColor,Y.instancing=O.instancing,Y.instancingColor=O.instancingColor,Y.instancingMorph=O.instancingMorph,Y.skinning=O.skinning,Y.morphTargets=O.morphTargets,Y.morphNormals=O.morphNormals,Y.morphColors=O.morphColors,Y.morphTargetsCount=O.morphTargetsCount,Y.numClippingPlanes=O.numClippingPlanes,Y.numIntersection=O.numClipIntersection,Y.vertexAlphas=O.vertexAlphas,Y.vertexTangents=O.vertexTangents,Y.toneMapping=O.toneMapping}function zl(M,O){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;T.setFromMatrixPosition(O.matrixWorld);for(let Y=0,W=M.length;Y<W;Y++){const X=M[Y];if(X.texture!==null&&X.boundingBox.containsPoint(T))return X}return null}function Gl(M,O,Y,W,X){O.isScene!==!0&&(O=tt),c.resetTextureUnits();const _e=O.fog,xe=W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial?O.environment:null,pe=B===null?L.outputColorSpace:B.isXRRenderTarget===!0?B.texture.colorSpace:He.workingColorSpace,Se=W.isMeshStandardMaterial||W.isMeshLambertMaterial&&!W.envMap||W.isMeshPhongMaterial&&!W.envMap,be=w.get(W.envMap||xe,Se),Fe=W.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,Ge=!!Y.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),Ae=!!Y.morphAttributes.position,et=!!Y.morphAttributes.normal,mt=!!Y.morphAttributes.color;let ht=an;W.toneMapped&&(B===null||B.isXRRenderTarget===!0)&&(ht=L.toneMapping);const nt=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,bt=nt!==void 0?nt.length:0,ge=E.get(W),Ut=b.state.lights;if(st===!0&&(ze===!0||M!==j)){const at=M===j&&W.id===V;ue.setState(W,M,at)}let Ye=!1;W.version===ge.__version?(ge.needsLights&&ge.lightsStateVersion!==Ut.state.version||ge.outputColorSpace!==pe||X.isBatchedMesh&&ge.batching===!1||!X.isBatchedMesh&&ge.batching===!0||X.isBatchedMesh&&ge.batchingColor===!0&&X.colorTexture===null||X.isBatchedMesh&&ge.batchingColor===!1&&X.colorTexture!==null||X.isInstancedMesh&&ge.instancing===!1||!X.isInstancedMesh&&ge.instancing===!0||X.isSkinnedMesh&&ge.skinning===!1||!X.isSkinnedMesh&&ge.skinning===!0||X.isInstancedMesh&&ge.instancingColor===!0&&X.instanceColor===null||X.isInstancedMesh&&ge.instancingColor===!1&&X.instanceColor!==null||X.isInstancedMesh&&ge.instancingMorph===!0&&X.morphTexture===null||X.isInstancedMesh&&ge.instancingMorph===!1&&X.morphTexture!==null||ge.envMap!==be||W.fog===!0&&ge.fog!==_e||ge.numClippingPlanes!==void 0&&(ge.numClippingPlanes!==ue.numPlanes||ge.numIntersection!==ue.numIntersection)||ge.vertexAlphas!==Fe||ge.vertexTangents!==Ge||ge.morphTargets!==Ae||ge.morphNormals!==et||ge.morphColors!==mt||ge.toneMapping!==ht||ge.morphTargetsCount!==bt||!!ge.lightProbeGrid!=b.state.lightProbeGridArray.length>0)&&(Ye=!0):(Ye=!0,ge.__version=W.version);let Gt=ge.currentProgram;Ye===!0&&(Gt=Gi(W,O,X),G&&W.isNodeMaterial&&G.onUpdateProgram(W,Gt,ge));let $t=!1,En=!1,Kn=!1;const it=Gt.getUniforms(),_t=ge.uniforms;if(ce.useProgram(Gt.program)&&($t=!0,En=!0,Kn=!0),W.id!==V&&(V=W.id,En=!0),ge.needsLights){const at=zl(b.state.lightProbeGridArray,X);ge.lightProbeGrid!==at&&(ge.lightProbeGrid=at,En=!0)}if($t||j!==M){ce.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),it.setValue(N,"projectionMatrix",M.projectionMatrix),it.setValue(N,"viewMatrix",M.matrixWorldInverse);const Tn=it.map.cameraPosition;Tn!==void 0&&Tn.setValue(N,Ze.setFromMatrixPosition(M.matrixWorld)),Je.logarithmicDepthBuffer&&it.setValue(N,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&it.setValue(N,"isOrthographic",M.isOrthographicCamera===!0),j!==M&&(j=M,En=!0,Kn=!0)}if(ge.needsLights&&(Ut.state.directionalShadowMap.length>0&&it.setValue(N,"directionalShadowMap",Ut.state.directionalShadowMap,c),Ut.state.spotShadowMap.length>0&&it.setValue(N,"spotShadowMap",Ut.state.spotShadowMap,c),Ut.state.pointShadowMap.length>0&&it.setValue(N,"pointShadowMap",Ut.state.pointShadowMap,c)),X.isSkinnedMesh){it.setOptional(N,X,"bindMatrix"),it.setOptional(N,X,"bindMatrixInverse");const at=X.skeleton;at&&(at.boneTexture===null&&at.computeBoneTexture(),it.setValue(N,"boneTexture",at.boneTexture,c))}X.isBatchedMesh&&(it.setOptional(N,X,"batchingTexture"),it.setValue(N,"batchingTexture",X._matricesTexture,c),it.setOptional(N,X,"batchingIdTexture"),it.setValue(N,"batchingIdTexture",X._indirectTexture,c),it.setOptional(N,X,"batchingColorTexture"),X._colorsTexture!==null&&it.setValue(N,"batchingColorTexture",X._colorsTexture,c));const yn=Y.morphAttributes;if((yn.position!==void 0||yn.normal!==void 0||yn.color!==void 0)&&Ce.update(X,Y,Gt),(En||ge.receiveShadow!==X.receiveShadow)&&(ge.receiveShadow=X.receiveShadow,it.setValue(N,"receiveShadow",X.receiveShadow)),(W.isMeshStandardMaterial||W.isMeshLambertMaterial||W.isMeshPhongMaterial)&&W.envMap===null&&O.environment!==null&&(_t.envMapIntensity.value=O.environmentIntensity),_t.dfgLUT!==void 0&&(_t.dfgLUT.value=dm()),En){if(it.setValue(N,"toneMappingExposure",L.toneMappingExposure),ge.needsLights&&Vl(_t,Kn),_e&&W.fog===!0&&z.refreshFogUniforms(_t,_e),z.refreshMaterialUniforms(_t,W,De,Ke,b.state.transmissionRenderTarget[M.id]),ge.needsLights&&ge.lightProbeGrid){const at=ge.lightProbeGrid;_t.probesSH.value=at.texture,_t.probesMin.value.copy(at.boundingBox.min),_t.probesMax.value.copy(at.boundingBox.max),_t.probesResolution.value.copy(at.resolution)}Ms.upload(N,Ha(ge),_t,c)}if(W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Ms.upload(N,Ha(ge),_t,c),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&it.setValue(N,"center",X.center),it.setValue(N,"modelViewMatrix",X.modelViewMatrix),it.setValue(N,"normalMatrix",X.normalMatrix),it.setValue(N,"modelMatrix",X.matrixWorld),W.uniformsGroups!==void 0){const at=W.uniformsGroups;for(let Tn=0,Zn=at.length;Tn<Zn;Tn++){const Wa=at[Tn];K.update(Wa,Gt),K.bind(Wa,Gt)}}return Gt}function Vl(M,O){M.ambientLightColor.needsUpdate=O,M.lightProbe.needsUpdate=O,M.directionalLights.needsUpdate=O,M.directionalLightShadows.needsUpdate=O,M.pointLights.needsUpdate=O,M.pointLightShadows.needsUpdate=O,M.spotLights.needsUpdate=O,M.spotLightShadows.needsUpdate=O,M.rectAreaLights.needsUpdate=O,M.hemisphereLights.needsUpdate=O}function Hl(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return Z},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return B},this.setRenderTargetTextures=function(M,O,Y){const W=E.get(M);W.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,W.__autoAllocateDepthBuffer===!1&&(W.__useRenderToTexture=!1),E.get(M.texture).__webglTexture=O,E.get(M.depthTexture).__webglTexture=W.__autoAllocateDepthBuffer?void 0:Y,W.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,O){const Y=E.get(M);Y.__webglFramebuffer=O,Y.__useDefaultFramebuffer=O===void 0};const kl=N.createFramebuffer();this.setRenderTarget=function(M,O=0,Y=0){B=M,Z=O,$=Y;let W=null,X=!1,_e=!1;if(M){const pe=E.get(M);if(pe.__useDefaultFramebuffer!==void 0){ce.bindFramebuffer(N.FRAMEBUFFER,pe.__webglFramebuffer),ne.copy(M.viewport),ie.copy(M.scissor),le=M.scissorTest,ce.viewport(ne),ce.scissor(ie),ce.setScissorTest(le),V=-1;return}else if(pe.__webglFramebuffer===void 0)c.setupRenderTarget(M);else if(pe.__hasExternalTextures)c.rebindTextures(M,E.get(M.texture).__webglTexture,E.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Fe=M.depthTexture;if(pe.__boundDepthTexture!==Fe){if(Fe!==null&&E.has(Fe)&&(M.width!==Fe.image.width||M.height!==Fe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");c.setupDepthRenderbuffer(M)}}const Se=M.texture;(Se.isData3DTexture||Se.isDataArrayTexture||Se.isCompressedArrayTexture)&&(_e=!0);const be=E.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(be[O])?W=be[O][Y]:W=be[O],X=!0):M.samples>0&&c.useMultisampledRTT(M)===!1?W=E.get(M).__webglMultisampledFramebuffer:Array.isArray(be)?W=be[Y]:W=be,ne.copy(M.viewport),ie.copy(M.scissor),le=M.scissorTest}else ne.copy(ae).multiplyScalar(De).floor(),ie.copy(ye).multiplyScalar(De).floor(),le=Le;if(Y!==0&&(W=kl),ce.bindFramebuffer(N.FRAMEBUFFER,W)&&ce.drawBuffers(M,W),ce.viewport(ne),ce.scissor(ie),ce.setScissorTest(le),X){const pe=E.get(M.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+O,pe.__webglTexture,Y)}else if(_e){const pe=O;for(let Se=0;Se<M.textures.length;Se++){const be=E.get(M.textures[Se]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+Se,be.__webglTexture,Y,pe)}}else if(M!==null&&Y!==0){const pe=E.get(M.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,pe.__webglTexture,Y)}V=-1},this.readRenderTargetPixels=function(M,O,Y,W,X,_e,xe,pe=0){if(!(M&&M.isWebGLRenderTarget)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Se=E.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&xe!==void 0&&(Se=Se[xe]),Se){ce.bindFramebuffer(N.FRAMEBUFFER,Se);try{const be=M.textures[pe],Fe=be.format,Ge=be.type;if(M.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+pe),!Je.textureFormatReadable(Fe)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Je.textureTypeReadable(Ge)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=M.width-W&&Y>=0&&Y<=M.height-X&&N.readPixels(O,Y,W,X,R.convert(Fe),R.convert(Ge),_e)}finally{const be=B!==null?E.get(B).__webglFramebuffer:null;ce.bindFramebuffer(N.FRAMEBUFFER,be)}}},this.readRenderTargetPixelsAsync=async function(M,O,Y,W,X,_e,xe,pe=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Se=E.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&xe!==void 0&&(Se=Se[xe]),Se)if(O>=0&&O<=M.width-W&&Y>=0&&Y<=M.height-X){ce.bindFramebuffer(N.FRAMEBUFFER,Se);const be=M.textures[pe],Fe=be.format,Ge=be.type;if(M.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+pe),!Je.textureFormatReadable(Fe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Je.textureTypeReadable(Ge))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ae=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Ae),N.bufferData(N.PIXEL_PACK_BUFFER,_e.byteLength,N.STREAM_READ),N.readPixels(O,Y,W,X,R.convert(Fe),R.convert(Ge),0);const et=B!==null?E.get(B).__webglFramebuffer:null;ce.bindFramebuffer(N.FRAMEBUFFER,et);const mt=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await wc(N,mt,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Ae),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,_e),N.deleteBuffer(Ae),N.deleteSync(mt),_e}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,O=null,Y=0){const W=Math.pow(2,-Y),X=Math.floor(M.image.width*W),_e=Math.floor(M.image.height*W),xe=O!==null?O.x:0,pe=O!==null?O.y:0;c.setTexture2D(M,0),N.copyTexSubImage2D(N.TEXTURE_2D,Y,0,0,xe,pe,X,_e),ce.unbindTexture()};const Wl=N.createFramebuffer(),Xl=N.createFramebuffer();this.copyTextureToTexture=function(M,O,Y=null,W=null,X=0,_e=0){let xe,pe,Se,be,Fe,Ge,Ae,et,mt;const ht=M.isCompressedTexture?M.mipmaps[_e]:M.image;if(Y!==null)xe=Y.max.x-Y.min.x,pe=Y.max.y-Y.min.y,Se=Y.isBox3?Y.max.z-Y.min.z:1,be=Y.min.x,Fe=Y.min.y,Ge=Y.isBox3?Y.min.z:0;else{const _t=Math.pow(2,-X);xe=Math.floor(ht.width*_t),pe=Math.floor(ht.height*_t),M.isDataArrayTexture?Se=ht.depth:M.isData3DTexture?Se=Math.floor(ht.depth*_t):Se=1,be=0,Fe=0,Ge=0}W!==null?(Ae=W.x,et=W.y,mt=W.z):(Ae=0,et=0,mt=0);const nt=R.convert(O.format),bt=R.convert(O.type);let ge;O.isData3DTexture?(c.setTexture3D(O,0),ge=N.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(c.setTexture2DArray(O,0),ge=N.TEXTURE_2D_ARRAY):(c.setTexture2D(O,0),ge=N.TEXTURE_2D),ce.activeTexture(N.TEXTURE0),ce.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,O.flipY),ce.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),ce.pixelStorei(N.UNPACK_ALIGNMENT,O.unpackAlignment);const Ut=ce.getParameter(N.UNPACK_ROW_LENGTH),Ye=ce.getParameter(N.UNPACK_IMAGE_HEIGHT),Gt=ce.getParameter(N.UNPACK_SKIP_PIXELS),$t=ce.getParameter(N.UNPACK_SKIP_ROWS),En=ce.getParameter(N.UNPACK_SKIP_IMAGES);ce.pixelStorei(N.UNPACK_ROW_LENGTH,ht.width),ce.pixelStorei(N.UNPACK_IMAGE_HEIGHT,ht.height),ce.pixelStorei(N.UNPACK_SKIP_PIXELS,be),ce.pixelStorei(N.UNPACK_SKIP_ROWS,Fe),ce.pixelStorei(N.UNPACK_SKIP_IMAGES,Ge);const Kn=M.isDataArrayTexture||M.isData3DTexture,it=O.isDataArrayTexture||O.isData3DTexture;if(M.isDepthTexture){const _t=E.get(M),yn=E.get(O),at=E.get(_t.__renderTarget),Tn=E.get(yn.__renderTarget);ce.bindFramebuffer(N.READ_FRAMEBUFFER,at.__webglFramebuffer),ce.bindFramebuffer(N.DRAW_FRAMEBUFFER,Tn.__webglFramebuffer);for(let Zn=0;Zn<Se;Zn++)Kn&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,E.get(M).__webglTexture,X,Ge+Zn),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,E.get(O).__webglTexture,_e,mt+Zn)),N.blitFramebuffer(be,Fe,xe,pe,Ae,et,xe,pe,N.DEPTH_BUFFER_BIT,N.NEAREST);ce.bindFramebuffer(N.READ_FRAMEBUFFER,null),ce.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(X!==0||M.isRenderTargetTexture||E.has(M)){const _t=E.get(M),yn=E.get(O);ce.bindFramebuffer(N.READ_FRAMEBUFFER,Wl),ce.bindFramebuffer(N.DRAW_FRAMEBUFFER,Xl);for(let at=0;at<Se;at++)Kn?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,_t.__webglTexture,X,Ge+at):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,_t.__webglTexture,X),it?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,yn.__webglTexture,_e,mt+at):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,yn.__webglTexture,_e),X!==0?N.blitFramebuffer(be,Fe,xe,pe,Ae,et,xe,pe,N.COLOR_BUFFER_BIT,N.NEAREST):it?N.copyTexSubImage3D(ge,_e,Ae,et,mt+at,be,Fe,xe,pe):N.copyTexSubImage2D(ge,_e,Ae,et,be,Fe,xe,pe);ce.bindFramebuffer(N.READ_FRAMEBUFFER,null),ce.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else it?M.isDataTexture||M.isData3DTexture?N.texSubImage3D(ge,_e,Ae,et,mt,xe,pe,Se,nt,bt,ht.data):O.isCompressedArrayTexture?N.compressedTexSubImage3D(ge,_e,Ae,et,mt,xe,pe,Se,nt,ht.data):N.texSubImage3D(ge,_e,Ae,et,mt,xe,pe,Se,nt,bt,ht):M.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,_e,Ae,et,xe,pe,nt,bt,ht.data):M.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,_e,Ae,et,ht.width,ht.height,nt,ht.data):N.texSubImage2D(N.TEXTURE_2D,_e,Ae,et,xe,pe,nt,bt,ht);ce.pixelStorei(N.UNPACK_ROW_LENGTH,Ut),ce.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Ye),ce.pixelStorei(N.UNPACK_SKIP_PIXELS,Gt),ce.pixelStorei(N.UNPACK_SKIP_ROWS,$t),ce.pixelStorei(N.UNPACK_SKIP_IMAGES,En),_e===0&&O.generateMipmaps&&N.generateMipmap(ge),ce.unbindTexture()},this.initRenderTarget=function(M){E.get(M).__webglFramebuffer===void 0&&c.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?c.setTextureCube(M,0):M.isData3DTexture?c.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?c.setTexture2DArray(M,0):c.setTexture2D(M,0),ce.unbindTexture()},this.resetState=function(){Z=0,$=0,B=null,ce.reset(),te.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=He._getDrawingBufferColorSpace(e),t.unpackColorSpace=He._getUnpackColorSpace()}}const hi=180,hs=1.62,pm=.95,$o=.38,mm=6.4,gr=9.6,_m=13.4,gm=.93,xm=4.8,vm=7.2,Jo=9.2,Mm=21,di=100,Sm=3,Em=18,Qo=1,ym=3,Tm=2,bm=.35,Am=.15,wm=.28,Rm=.4,ds=8e3,fs=18e3,ps=32e3,en={pulse:{label:"Pulse",cd:.085,dmg:22,mag:32,reload:1.1,spread:.014,tracer:65525},slug:{label:"Slug",cd:.7,dmg:80,mag:6,reload:1.4,spread:0,tracer:16769359}},Ol=[[0,0,14,3,1.2],[0,0,1.2,3,14],[-8,-10,3,2.4,3],[8,10,3,2.4,3],[-14,12,2.4,2.4,2.4],[14,-12,2.4,2.4,2.4],[5,-5,1.6,5,1.6],[-5,5,1.6,5,1.6],[18,0,1.6,3,8],[-18,0,1.6,3,8],[0,18,8,3,1.6],[0,-18,8,3,1.6],[10,4,4.5,1.1,.6],[-10,-4,4.5,1.1,.6]],St=22,el=[[0,16,2],[0,-16,2],[16,0,2],[-16,0,2],[12,12,3],[-12,12,3],[12,-12,3],[-12,-12,3],[6,0,4.2],[-6,0,4.2],[0,6,1.4],[0,-6,1.4],[18,8,2.6],[-18,-8,2.6],[8,-18,2.6],[-8,18,2.6],[4,10,1],[-4,-10,1],[10,-4,1],[-10,4,1]],tn=(i,e,t)=>{for(const[n,s,r,,a]of Ol){const o=Math.abs(i-n)-r/2,u=Math.abs(e-s)-a/2;if(o<t&&u<t)return!0}return Math.abs(i)>St-t||Math.abs(e)>St-t},Cm=i=>()=>{let e=i=i+1831565813|0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296},tl=()=>Math.floor(Date.now()/864e5);function Dm(){const i=Ns.useRef(null),[e,t]=Ns.useState({status:"ready",timeLeft:hi,score:0,combo:1,hp:di,weapon:"pulse",ammo:en.pulse.mag,reloading:!1,kills:0,hsCount:0,shotsFired:0,shotsHit:0,comboMax:1,dashReady:!0,medal:null,pb:0,newPb:!1,locked:!1});Ns.useEffect(()=>{const r=i.current;if(!r)return;const a=new fm({antialias:!0});a.setSize(r.clientWidth,r.clientHeight),a.setPixelRatio(Math.min(window.devicePixelRatio,2)),a.setClearColor(659476),r.appendChild(a.domElement);const o=new kc;o.fog=new Ea(659476,24,64);const u=new kt(100,r.clientWidth/r.clientHeight,.1,200);o.add(new hu(16777215,.55));const h=new uu(16777215,.95);h.position.set(10,22,5),o.add(h);const p=new ct(new Bi(St*2,St*2),new Ot({color:1120802,roughness:.92}));p.rotation.x=-Math.PI/2,o.add(p);const m=new _u(St*2,44,1911348,1055265);m.position.y=.01,o.add(m);const d=new Ot({color:15265e3,roughness:.8}),_=new Ot({color:65525,emissive:18499,emissiveIntensity:.6,roughness:.35});[[0,St,St*2,4,.6],[0,-St,St*2,4,.6],[St,0,.6,4,St*2],[-St,0,.6,4,St*2]].forEach(([c,w,D,k,F])=>{const H=new ct(new Bt(D,k,F),d);H.position.set(c,k/2,w),o.add(H)}),Ol.forEach(([c,w,D,k,F])=>{const H=new ct(new Bt(D,k,F),d);H.position.set(c,k/2,w),o.add(H);const z=new ct(new Bt(D,.06,F),_);z.position.set(c,k+.03,w),o.add(z)});const v=new Xn;v.add(new ct(new Bt(.22,.14,.48),new Ot({color:1317408})));const S=new ct(new Bt(.06,.06,.58),new Ot({color:2767430}));S.position.z=-.5,v.add(S);const f=new ct(new Bt(.22,.02,.48),new Ot({color:65525,emissive:51392,emissiveIntensity:.9}));f.position.y=.08,v.add(f),v.position.set(.22,-.2,-.36),u.add(v),o.add(u);const l={pos:new U(0,hs,14),vel:new U,yaw:Math.PI,pitch:0,onGround:!0,sliding:!1,slideTimer:0,eye:hs,hp:di,lastHurt:999,weapon:"pulse",ammo:{pulse:en.pulse.mag,slug:en.slug.mag},fireCd:0,reloadIn:0,dashReady:!0},x=[],y=c=>{const w=new Xn,D=new ct(new Bt(.55,.55,.55),new Ot({color:65525,emissive:51392,emissiveIntensity:1.1,roughness:.35})),k=new ct(new Bt(.18,.18,.18),new Ot({color:16737920,emissive:16726618,emissiveIntensity:1.3}));w.add(D),w.add(k),w.position.copy(c),o.add(w),x.push({kind:"target",mesh:w,body:D,hp:1,maxHp:1,pos:c.clone(),bob:Math.random()*Math.PI*2,spawnT:we.getElapsedTime()})},T=c=>{const w=new Xn,D=new ct(new Ca(.42,0),new Ot({color:16731501,emissive:12264256,emissiveIntensity:.9,flatShading:!0,roughness:.45})),k=new ct(new Pa(.62,.04,8,20),new Ot({color:65525,emissive:51392,emissiveIntensity:.7}));k.rotation.x=Math.PI/2,w.add(D),w.add(k),w.position.copy(c),o.add(w),x.push({kind:"drone",mesh:w,body:D,hp:30,maxHp:30,pos:c.clone(),vel:new U,fireCd:2+Math.random()*1.5,wobble:Math.random()*Math.PI*2})},P=c=>{const w=new ct(new wa(.4,1.1,4,10),new Ot({color:2765632,roughness:.55}));w.position.copy(c);const D=new ct(new Di(.28,12,10),new Ot({color:16731501,emissive:10035248,emissiveIntensity:.8}));D.position.set(c.x,c.y+.85,c.z),o.add(w),o.add(D),x.push({kind:"prowler",mesh:w,head:D,hp:60,maxHp:60,pos:c.clone(),fireCd:1.4+Math.random()*.8,strafe:Math.random()>.5?1:-1,strafeTick:0})},b=[],I=new Di(.12,8,8),g=new Ot({color:16731501,emissive:13377600,emissiveIntensity:1.2}),A=(c,w)=>{const D=new ct(I,g);D.position.copy(c),o.add(D);const k=w.clone().sub(c).normalize();b.push({mesh:D,vel:k.multiplyScalar(32),life:2.2})},L=[],C=new Tt;C.setAttribute("position",new Wt(new Float32Array(6),3));const G=(c,w,D)=>{const k=new Tt,F=new Float32Array([c.x,c.y,c.z,w.x,w.y,w.z]);k.setAttribute("position",new Wt(F,3));const H=new Aa({color:D,transparent:!0,opacity:.9}),z=new yl(k,H);o.add(z),L.push({line:z,mat:H,life:.12})},Z=[],$=new Di(.08,6,6),B=(c,w,D=8)=>{const k=new Ta({color:w,transparent:!0,opacity:1});for(let F=0;F<D;F++){const H=new ct($,k);H.position.copy(c);const z=new U((Math.random()-.5)*2,Math.random()*1.2,(Math.random()-.5)*2).normalize().multiplyScalar(2+Math.random()*3);o.add(H),Z.push({mesh:H,vel:z,life:.5,mat:k})}},V={};let j=!1;const ne=c=>{if(ye.current.status==="ended"&&c.code==="KeyR"){st();return}V[c.code]=!0,c.code==="Digit1"&&le("pulse"),c.code==="Digit2"&&le("slug"),c.code==="KeyQ"&&le(l.weapon==="pulse"?"slug":"pulse"),c.code==="KeyR"&&ve(),(c.code==="ShiftLeft"||c.code==="ShiftRight")&&!l.onGround&&l.dashReady&&Te()},ie=c=>{V[c.code]=!1};window.addEventListener("keydown",ne),window.addEventListener("keyup",ie);const le=c=>{c!==l.weapon&&(l.weapon=c,l.fireCd=.12)},ve=()=>{const c=en[l.weapon];l.reloadIn>0||l.ammo[l.weapon]>=c.mag||(l.reloadIn=c.reload)},Te=()=>{const c=new U(-Math.sin(l.yaw),0,-Math.cos(l.yaw)),w=new U(Math.cos(l.yaw),0,-Math.sin(l.yaw)),D=new U;V.KeyW&&D.add(c),V.KeyS&&D.sub(c),V.KeyD&&D.add(w),V.KeyA&&D.sub(w),D.lengthSq()<.01&&D.copy(c),D.normalize(),l.vel.x=D.x*Jo,l.vel.z=D.z*Jo,l.vel.y=Math.max(l.vel.y,1.2),l.dashReady=!1},Ve=()=>{var w,D;const c=ye.current.status;(c==="ready"||c==="ended")&&st(),document.pointerLockElement!==a.domElement&&((D=(w=a.domElement).requestPointerLock)==null||D.call(w))};a.domElement.addEventListener("click",Ve);const Ke=()=>Le("locked",document.pointerLockElement===a.domElement);document.addEventListener("pointerlockchange",Ke);const De=c=>{document.pointerLockElement===a.domElement&&(l.yaw-=c.movementX*.0022,l.pitch-=c.movementY*.0022,l.pitch=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,l.pitch)))};document.addEventListener("mousemove",De);const J=()=>{document.pointerLockElement===a.domElement&&(j=!0)},he=()=>{j=!1};a.domElement.addEventListener("mousedown",J),window.addEventListener("mouseup",he);const ae=()=>{u.aspect=r.clientWidth/r.clientHeight,u.updateProjectionMatrix(),a.setSize(r.clientWidth,r.clientHeight)};window.addEventListener("resize",ae);const ye={current:{status:"ready",timeLeft:hi,score:0,combo:1,comboMax:1,kills:0,hsCount:0,shotsFired:0,shotsHit:0,lastKillT:-999,runStart:0}},Le=(c,w)=>t(D=>({...D,[c]:w})),we=new mu,st=()=>{var c,w;for(let D=x.length-1;D>=0;D--){const k=x[D];k.mesh&&o.remove(k.mesh),k.head&&o.remove(k.head)}x.length=0;for(let D=b.length-1;D>=0;D--)o.remove(b[D].mesh);b.length=0,l.pos.set(0,hs,14),l.vel.set(0,0,0),l.yaw=Math.PI,l.pitch=0,l.hp=di,l.lastHurt=999,l.ammo.pulse=en.pulse.mag,l.ammo.slug=en.slug.mag,l.fireCd=0,l.reloadIn=0,l.dashReady=!0,l.weapon="pulse",ye.current={status:"playing",timeLeft:hi,score:0,combo:1,comboMax:1,kills:0,hsCount:0,shotsFired:0,shotsHit:0,lastKillT:-999,runStart:we.getElapsedTime()},je.reset();for(let D=0;D<3;D++)je.forceSpawnTarget();t(D=>({...D,status:"playing",timeLeft:hi,score:0,combo:1,hp:di,weapon:"pulse",ammo:en.pulse.mag,reloading:!1,kills:0,hsCount:0,shotsFired:0,shotsHit:0,comboMax:1,dashReady:!0,medal:null,newPb:!1})),document.pointerLockElement!==a.domElement&&((w=(c=a.domElement).requestPointerLock)==null||w.call(c))},ze=()=>{var H;const c=ye.current;c.status="ended";const w=c.shotsFired===0?0:c.shotsHit/c.shotsFired,D=c.score>=ps?"gold":c.score>=fs?"silver":c.score>=ds?"bronze":null;ql("slipshot",c.score,{mode:"score_attack",kills:c.kills,accuracy:Math.round(w*100),headshots:c.hsCount,combo_max:Math.round(c.comboMax*100)/100,medal:D||"none",seed:tl()});let k=0;try{k=Number(localStorage.getItem("pgplay-best-slipshot"))||0}catch{}const F=c.score>k;if(F)try{localStorage.setItem("pgplay-best-slipshot",String(c.score))}catch{}t(z=>({...z,status:"ended",score:c.score,kills:c.kills,hsCount:c.hsCount,comboMax:Math.round(c.comboMax*100)/100,shotsFired:c.shotsFired,shotsHit:c.shotsHit,medal:D,pb:Math.max(k,c.score),newPb:F})),document.pointerLockElement===a.domElement&&((H=document.exitPointerLock)==null||H.call(document))},je=(()=>{const c=Cm(tl()^334513);let w=0,D=0,k=0;const F=de=>de[Math.floor(c()*de.length)],H=()=>{for(let Re=0;Re<10;Re++){const R=F(el),te=R[0]-l.pos.x,K=R[1]-l.pos.z;if(te*te+K*K>25)return new U(R[0],R[2],R[1])}const de=F(el);return new U(de[0],de[2],de[1])},z=()=>{for(let de=0;de<20;de++){const Re=(c()-.5)*(St-4)*2,R=(c()-.5)*(St-4)*2;if(!tn(Re,R,.8))return new U(Re,3.4+c()*1.4,R)}return new U(0,4,10)},q=()=>{for(let de=0;de<20;de++){const Re=(c()-.5)*(St-3)*2,R=(c()-.5)*(St-3)*2,te=Re-l.pos.x,K=R-l.pos.z;if(!tn(Re,R,.5)&&te*te+K*K>64)return new U(Re,1,R)}return new U(12,1,12)},Q=de=>x.reduce((Re,R)=>Re+(R.kind===de?1:0),0),ue=de=>de<60?0:de<120?1:2;return{step:(de,Re)=>{const R=ue(Re),te=R===0?1.5:R===1?1.1:.85,K=R===0?8:R===1?10:12;for(w-=de;w<=0&&Q("target")<K;)y(H()),w+=te;if(w<-.1&&(w=0),Re>18){const ee=R===0?5.5:R===1?3.6:2.4,Me=R===0?2:R===1?3:4;for(D-=de;D<=0&&Q("drone")<Me;)T(z()),D+=ee;D<-.1&&(D=0)}if(Re>58){const ee=R===1?10:6.5,Me=R===1?2:3;for(k-=de;k<=0&&Q("prowler")<Me;)P(q()),k+=ee;k<-.1&&(k=0)}},reset:()=>{w=.3,D=0,k=0},forceSpawnTarget:()=>y(H())}})(),Ze=new pu,Ue=new U,tt=new U,ot=()=>{const c=en[l.weapon];if(l.fireCd>0||ye.current.status!=="playing"||l.reloadIn>0)return;if(l.ammo[l.weapon]<=0){ve();return}if(l.fireCd=c.cd,l.ammo[l.weapon]--,ye.current.shotsFired++,u.getWorldPosition(Ue),tt.set(0,0,-1).applyQuaternion(u.quaternion),c.spread>0){const Q=Math.hypot(l.vel.x,l.vel.z)>1?c.spread*.6:c.spread;tt.x+=(Math.random()-.5)*Q,tt.y+=(Math.random()-.5)*Q,tt.normalize()}Ze.set(Ue,tt),Ze.far=80;const w=[];for(const q of x)q.body?w.push(q.body):q.mesh&&w.push(q.mesh),q.head&&w.push(q.head);const D=Ze.intersectObjects(w,!1),k=new U,F=Ct(Ue,tt,k),H=D.find(q=>{for(const Q of x)if(Q.body===q.object||Q.mesh===q.object||Q.head===q.object)return q._entity=Q,q._isHead=Q.head===q.object,!0;return!1});let z=k;H&&H.distance<F&&(z=H.point.clone(),ye.current.shotsHit++,N(H._entity,H._isHead,c)),G(Ue.clone().add(tt.clone().multiplyScalar(.8)),z,c.tracer)},Ct=(c,w,D)=>{for(let H=.25;H<80;H+=.25){const z=c.x+w.x*H,q=c.y+w.y*H,Q=c.z+w.z*H;if(q<.01||q>10||tn(z,Q,.05))return D.set(z,q,Q),H}return D.set(c.x+w.x*80,c.y+w.y*80,c.z+w.z*80),80},N=(c,w,D)=>{const k=!l.onGround;let F=D.dmg;w&&(F=Math.round(F*(l.weapon==="slug"?2.5:1.5))),c.hp-=F,c.body&&(c.body.scale.setScalar(1.25),setTimeout(()=>{c.body&&c.body.scale.setScalar(1)},60)),c.hp<=0&&ft(c,w,k)},ft=(c,w,D)=>{const k=ye.current,F=c.kind==="target"?60:c.kind==="drone"?180:360,H=k.combo,z=w?1.5:1,q=Math.round(F*H*z);k.score+=q,k.kills++,w&&k.hsCount++;let Q=D?wm:Am;w&&(Q=Math.max(Q,Rm)),k.combo=Math.min(ym,k.combo+Q),k.combo>k.comboMax&&(k.comboMax=k.combo),k.lastKillT=we.getElapsedTime(),Je(q,w),D&&(l.dashReady=!0);const ue=c.mesh?c.mesh.position:c.pos;B(ue.clone(),c.kind==="target"?65525:16731501,c.kind==="target"?8:14),c.mesh&&o.remove(c.mesh),c.head&&o.remove(c.head);const se=x.indexOf(c);se>=0&&x.splice(se,1)},Oe=document.createElement("div");Oe.className="slipshot-popups",r.appendChild(Oe);const Je=(c,w)=>{const D=document.createElement("div");D.className="slipshot-popup"+(w?" is-head":""),D.textContent="+"+c,Oe.appendChild(D),setTimeout(()=>D.remove(),700)};let ce=0,rt=0;const E=()=>{ce=requestAnimationFrame(E);const c=Math.min(.05,we.getDelta()),w=we.getElapsedTime(),D=ye.current;l.reloadIn>0&&(l.reloadIn-=c,l.reloadIn<=0&&(l.ammo[l.weapon]=en[l.weapon].mag)),l.fireCd-=c,l.lastHurt+=c,l.lastHurt>Sm&&l.hp>0&&l.hp<di&&(l.hp=Math.min(di,l.hp+Em*c));const k=D.status==="playing";if(k&&l.hp>0&&document.pointerLockElement===a.domElement){const F=new U(-Math.sin(l.yaw),0,-Math.cos(l.yaw)),H=new U(Math.cos(l.yaw),0,-Math.sin(l.yaw)),z=new U;V.KeyW&&z.add(F),V.KeyS&&z.sub(F),V.KeyD&&z.add(H),V.KeyA&&z.sub(H);const q=z.length();q>0&&z.normalize();const Q=V.ShiftLeft||V.ShiftRight,ue=V.ControlLeft||V.ControlRight||V.KeyC||Q&&l.onGround;if(!l.sliding&&ue&&l.onGround&&q>.1){l.sliding=!0,l.slideTimer=0;const de=Math.max(gr,_m);l.vel.x=z.x*de,l.vel.z=z.z*de}if(l.sliding&&!ue&&(l.sliding=!1),l.sliding){const de=6*c;if(l.vel.x+=z.x*de,l.vel.z+=z.z*de,Math.hypot(l.vel.x,l.vel.z)>xm){const R=Math.pow(gm,c*60);l.vel.x*=R,l.vel.z*=R}l.slideTimer+=c,l.slideTimer>1.4&&Math.hypot(l.vel.x,l.vel.z)<gr&&(l.sliding=!1)}else{const de=Q&&l.onGround?gr:mm;if(l.onGround){const R=10*c,te=Math.hypot(l.vel.x,l.vel.z);if(te>.01){const K=Math.max(0,te-de)*R+R*.6,me=Math.max(0,te-K)/te;l.vel.x*=me,l.vel.z*=me}}const Re=l.onGround?55:22;if(q>0){const R=de,te=l.vel.x*z.x+l.vel.z*z.z,K=Math.min(Re*c,Math.max(0,R-te));l.vel.x+=z.x*K,l.vel.z+=z.z*K}}V.Space&&l.onGround&&(l.vel.y=vm,l.onGround=!1),l.vel.y-=Mm*c;const se=l.pos.x+l.vel.x*c,re=l.pos.z+l.vel.z*c;tn(se,l.pos.z,$o)?l.vel.x*=-.15:l.pos.x=se,tn(l.pos.x,re,$o)?l.vel.z*=-.15:l.pos.z=re,l.pos.y+=l.vel.y*c;const Ce=l.sliding?pm:hs;l.eye+=(Ce-l.eye)*Math.min(1,c*14),l.pos.y<=l.eye&&(l.pos.y=l.eye,l.vel.y=0,l.onGround||(l.onGround=!0,l.dashReady=!0)),j&&ot()}if(u.position.copy(l.pos),u.rotation.order="YXZ",u.rotation.y=l.yaw,u.rotation.x=l.pitch,k){const F=w-D.runStart;je.step(c,F),Math.max(0,hi-F)<=0&&ze(),w-D.lastKillT>Tm&&D.combo>Qo&&(D.combo=Math.max(Qo,D.combo-bm*c))}for(const F of x)if(F.kind==="target")F.bob+=c*2,F.mesh.position.y=F.pos.y+Math.sin(F.bob)*.14,F.mesh.rotation.y+=c*1.1;else if(F.kind==="drone"){F.wobble+=c;const H=l.pos.clone().sub(F.mesh.position),z=H.length();z>.1&&H.multiplyScalar(1/z),F.mesh.position.x+=H.x*1.8*c,F.mesh.position.z+=H.z*1.8*c,F.mesh.position.y=3.4+Math.sin(F.wobble*1.3)*.35,F.mesh.rotation.y+=c*.8,F.pos.copy(F.mesh.position),F.fireCd-=c,F.fireCd<=0&&z<24&&k&&(F.fireCd=2.4+Math.random()*.8,A(F.mesh.position.clone(),l.pos.clone()))}else if(F.kind==="prowler"){const H=l.pos.x-F.pos.x,z=l.pos.z-F.pos.z,q=Math.hypot(H,z),Q=Math.atan2(z,H),ue=q>9?3:q<4?-1.8:0,se=F.pos.x+Math.cos(Q)*ue*c,re=F.pos.z+Math.sin(Q)*ue*c;tn(se,F.pos.z,.5)||(F.pos.x=se),tn(F.pos.x,re,.5)||(F.pos.z=re),F.strafeTick+=c,F.strafeTick>1.3&&(F.strafeTick=0,F.strafe=Math.random()>.5?1:-1);const Ce=F.pos.x+Math.cos(Q+Math.PI/2)*2.2*c*F.strafe,de=F.pos.z+Math.sin(Q+Math.PI/2)*2.2*c*F.strafe;if(tn(Ce,F.pos.z,.5)||(F.pos.x=Ce),tn(F.pos.x,de,.5)||(F.pos.z=de),F.mesh.position.set(F.pos.x,1,F.pos.z),F.mesh.rotation.y=-Q+Math.PI/2,F.head&&F.head.position.set(F.pos.x,1.85,F.pos.z),F.fireCd-=c,F.fireCd<=0&&q<26&&k){F.fireCd=1.6+Math.random()*.6;const Re=new U(F.pos.x,1.4,F.pos.z),R=l.pos.clone();A(Re,R)}}for(let F=b.length-1;F>=0;F--){const H=b[F];H.mesh.position.addScaledVector(H.vel,c),H.life-=c;const z=tn(H.mesh.position.x,H.mesh.position.z,.1)||H.mesh.position.y<.05,q=H.mesh.position.clone().sub(l.pos);q.y+=.4;const Q=q.lengthSq()<.9*.9;(H.life<=0||z||Q)&&(Q&&l.hp>0&&(l.hp=Math.max(0,l.hp-10),l.lastHurt=0,l.hp<=0&&ze()),o.remove(H.mesh),b.splice(F,1))}for(let F=L.length-1;F>=0;F--){const H=L[F];H.life-=c,H.mat.opacity=Math.max(0,H.life/.12),H.life<=0&&(o.remove(H.line),H.line.geometry.dispose(),H.mat.dispose(),L.splice(F,1))}for(let F=Z.length-1;F>=0;F--){const H=Z[F];H.life-=c,H.mesh.position.addScaledVector(H.vel,c),H.vel.y-=8*c,H.mat.opacity=Math.max(0,H.life/.5),H.life<=0&&(o.remove(H.mesh),Z.splice(F,1))}if(a.render(o,u),rt+=c,rt>.1){rt=0;const F=w-D.runStart;t(H=>H.status==="ended"?H:{...H,status:D.status,timeLeft:D.status==="playing"?Math.max(0,hi-F):H.timeLeft,score:D.score,combo:Math.round(D.combo*100)/100,hp:Math.round(l.hp),weapon:l.weapon,ammo:l.ammo[l.weapon],reloading:l.reloadIn>0,kills:D.kills,hsCount:D.hsCount,dashReady:l.dashReady})}};return E(),()=>{var c;cancelAnimationFrame(ce),window.removeEventListener("keydown",ne),window.removeEventListener("keyup",ie),window.removeEventListener("mouseup",he),window.removeEventListener("resize",ae),document.removeEventListener("pointerlockchange",Ke),document.removeEventListener("mousemove",De),a.domElement.removeEventListener("click",Ve),a.domElement.removeEventListener("mousedown",J),document.pointerLockElement===a.domElement&&((c=document.exitPointerLock)==null||c.call(document)),a.dispose(),C.dispose(),$.dispose(),I.dispose(),r.innerHTML=""}},[]);const n=r=>{const a=Math.floor(r/60),o=Math.floor(r%60);return`${a}:${String(o).padStart(2,"0")}`},s=e.combo>=2.5?3:e.combo>=1.7?2:1;return Ee.jsxs("div",{className:"slipshot",children:[Ee.jsxs("div",{className:"slipshot-mount",ref:i,children:[e.status!=="ready"&&Ee.jsxs("div",{className:"slipshot-hud-top",children:[Ee.jsx("div",{className:"slipshot-timer",children:n(e.timeLeft)}),Ee.jsxs("div",{className:`slipshot-combo tier-${s}`,children:[Ee.jsx("span",{className:"slipshot-combo-x",children:"×"}),Ee.jsx("span",{className:"slipshot-combo-v",children:e.combo.toFixed(2)})]}),Ee.jsx("div",{className:"slipshot-score",children:e.score.toLocaleString()})]}),e.status!=="ready"&&Ee.jsxs("div",{className:"slipshot-hud-bl",children:[Ee.jsxs("div",{className:"slipshot-weapon",children:[Ee.jsx("span",{className:e.weapon==="pulse"?"is-active":"",children:"1 · Pulse"}),Ee.jsx("span",{className:e.weapon==="slug"?"is-active":"",children:"2 · Slug"})]}),Ee.jsx("div",{className:"slipshot-ammo",children:e.reloading?Ee.jsx("span",{className:"slipshot-reloading",children:"reloading…"}):Ee.jsxs(Ee.Fragment,{children:[Ee.jsx("b",{children:e.ammo})," / ",en[e.weapon].mag]})}),Ee.jsxs("div",{className:"slipshot-hp",children:[Ee.jsx("div",{className:"slipshot-hp-bar",style:{width:`${e.hp}%`}}),Ee.jsx("span",{children:e.hp})]})]}),e.status!=="ready"&&Ee.jsx("div",{className:"slipshot-hud-br",children:Ee.jsxs("div",{className:`slipshot-dash ${e.dashReady?"is-ready":""}`,children:[Ee.jsx("span",{className:"slipshot-dash-dot"})," DASH"]})}),e.status==="ready"&&Ee.jsxs("div",{className:"slipshot-overlay",children:[Ee.jsx("div",{className:"slipshot-eyebrow",children:"Pulse Range · Sector 7"}),Ee.jsx("div",{className:"slipshot-title",children:"Click to start a run"}),Ee.jsxs("div",{className:"slipshot-sub",children:[Ee.jsx("b",{children:"WASD"})," move · ",Ee.jsx("b",{children:"Mouse"})," aim · ",Ee.jsx("b",{children:"Shift"})," slide (ground) / airdash (air) · ",Ee.jsx("b",{children:"Space"})," jump · ",Ee.jsx("b",{children:"LMB"})," fire · ",Ee.jsx("b",{children:"1 / 2 / Q"})," swap · ",Ee.jsx("b",{children:"R"})," reload"]}),Ee.jsxs("div",{className:"slipshot-sub",style:{marginTop:8,opacity:.85},children:["180 seconds. Chain ",Ee.jsx("b",{children:"slide → jump → airdash"})," to keep the combo climbing."]})]}),e.status==="ended"&&Ee.jsxs("div",{className:"slipshot-overlay slipshot-end",children:[Ee.jsx("div",{className:"slipshot-eyebrow",children:"Run complete"}),e.medal&&Ee.jsx("div",{className:`slipshot-medal medal-${e.medal}`,children:e.medal}),!e.medal&&Ee.jsx("div",{className:"slipshot-medal medal-none",children:"keep going"}),Ee.jsxs("div",{className:"slipshot-final-score",children:[e.score.toLocaleString(),e.newPb&&Ee.jsx("span",{className:"slipshot-pb-chip",children:"NEW PB"})]}),Ee.jsxs("div",{className:"slipshot-breakdown",children:[Ee.jsxs("div",{children:[Ee.jsx("b",{children:e.kills})," kills"]}),Ee.jsxs("div",{children:[Ee.jsx("b",{children:e.hsCount})," headshots"]}),Ee.jsxs("div",{children:[Ee.jsxs("b",{children:["×",e.comboMax.toFixed(2)]})," peak combo"]}),Ee.jsxs("div",{children:[Ee.jsxs("b",{children:[e.shotsFired===0?0:Math.round(e.shotsHit/e.shotsFired*100),"%"]})," accuracy"]})]}),Ee.jsxs("div",{className:"slipshot-end-thresholds",children:[Ee.jsxs("span",{className:e.score>=ds?"hit":"",children:["Bronze ",ds.toLocaleString()]}),Ee.jsxs("span",{className:e.score>=fs?"hit":"",children:["Silver ",fs.toLocaleString()]}),Ee.jsxs("span",{className:e.score>=ps?"hit":"",children:["Gold ",ps.toLocaleString()]})]}),Ee.jsxs("div",{className:"slipshot-sub",style:{marginTop:10},children:["Click the arena or press ",Ee.jsx("b",{children:"R"})," to run again."]})]}),e.status==="playing"&&!e.locked&&Ee.jsx("div",{className:"slipshot-overlay slipshot-paused",children:Ee.jsx("div",{className:"slipshot-title",children:"Click to resume"})})]}),Ee.jsxs("div",{className:"slipshot-hint",children:["Slide → Jump preserves speed · Airdash in the air · Kills in the air refund the dash · Bronze ",ds.toLocaleString()," · Silver ",fs.toLocaleString()," · Gold ",ps.toLocaleString()]})]})}export{Dm as default};
