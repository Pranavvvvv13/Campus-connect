"use client";

import {useEffect,useRef} from "react";

import * as THREE from "three";



/** A single persistent, scroll-choreographed scene for the entire page. */

export default function SpatialWorld({lightMode,paused,embedded=false}:{lightMode:boolean;paused:boolean;embedded?:boolean}){

 const host=useRef<HTMLDivElement>(null);

 useEffect(()=>{

  const container=host.current;if(!container)return;

  let renderer:THREE.WebGLRenderer;

  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"});}catch{return;}

  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));container.appendChild(renderer.domElement);

  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(45,1,.1,70);camera.position.set(0,0,embedded?12:16);

  const color=lightMode?0x426638:0xa4c48c;

  const assembly=new THREE.Group();scene.add(assembly);

  const orb=new THREE.Group();assembly.add(orb);

  const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(2.5,2),new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:lightMode?.18:.25}));orb.add(sphere);

  const rings:THREE.Mesh[]=[];

  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(3.25+i*.35,.012,6,100),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.45}));ring.rotation.set(i*.8,.5+i*.6,0);orb.add(ring);rings.push(ring);}

  const nodes=new THREE.Group();orb.add(nodes);

  for(let i=0;i<16;i++){const a=i*2.39996;const y=1-(i/15)*2;const r=Math.sqrt(1-y*y);const dot=new THREE.Mesh(new THREE.SphereGeometry(i%4===0?.075:.04,8,8),new THREE.MeshBasicMaterial({color:i%4===0?0xd89858:color}));dot.position.set(Math.cos(a)*r*2.6,y*2.6,Math.sin(a)*r*2.6);nodes.add(dot);}

  const strata=new THREE.Group();assembly.add(strata);

  for(let i=0;i<5;i++){const slab=new THREE.Mesh(new THREE.CylinderGeometry(2.3,2.5,.13,6),new THREE.MeshStandardMaterial({color:lightMode?0x719260:0x426638,metalness:.35,roughness:.45,transparent:true,opacity:.32}));slab.position.y=(i-2)*.55;slab.rotation.y=i*.13;strata.add(slab);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.5}));slab.add(edge);}

  scene.add(new THREE.AmbientLight(0xffffff,2));const light=new THREE.DirectionalLight(0xf1ffdb,3);light.position.set(5,8,10);scene.add(light);

  const dustGeo=new THREE.BufferGeometry();const values=new Float32Array(90*3);for(let i=0;i<90;i++){values[i*3]=Math.sin(i*137.5)*17;values[i*3+1]=Math.cos(i*43.7)*10;values[i*3+2]=Math.sin(i*17.3)*8-3;}dustGeo.setAttribute("position",new THREE.BufferAttribute(values,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color,size:.035,transparent:true,opacity:.45}));scene.add(dust);

  const reduced=matchMedia("(prefers-reduced-motion: reduce)");let frame=0,last=0,time=0,progress=0,target=0,px=0,py=0,inView=true;

  const onScroll=()=>{target=window.scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);};

  const pointer=(e:PointerEvent)=>{if(e.pointerType==="mouse"){px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5;}};

  const draw=(now:number)=>{frame=0;const dt=Math.min((now-last)/1000,.05);last=now;const still=paused||reduced.matches;if(!still)time+=dt;progress+=(target-progress)*(still?1:1-Math.exp(-dt*4));

   const chapter=Math.max(0,Math.min(1,(progress-.1)*2.5));container.style.opacity=String(.15+chapter*.85);

   assembly.position.set(embedded?0:(innerWidth<650?2.8:4.8)-Math.sin(progress*Math.PI)*1.8,embedded?0:Math.sin(progress*Math.PI*2)*1.5,-2);

   assembly.rotation.set(still?.1:py*.12,embedded?.15:(still?0:time*.07+progress*2),embedded?0:progress*.15);

   orb.scale.setScalar(.65+Math.sin(progress*Math.PI)*.45);orb.rotation.z=still?0:time*.06;orb.rotation.y=still?0:time*.12;

   orb.visible=embedded||progress<.3||progress>.68;strata.visible=embedded||(progress>=.3&&progress<=.68);if(embedded){const compact=container.clientWidth/container.clientHeight<1.6;orb.position.x=compact?1.65:3.2;strata.position.x=compact?-1.65:-3.2;orb.scale.setScalar(compact?.46:.7);strata.scale.setScalar(compact?.5:.8);}strata.rotation.set(.3,still?.3:time*.12, .15);

   strata.children.forEach((slab,i)=>{slab.position.y=(i-2)*(.55+(still?0:(Math.sin(time*.7)+1)*.16));});

   rings.forEach((ring,i)=>{if(!still)ring.rotation.z=time*(.1+i*.04);});dust.rotation.y=still?0:time*.015;

   camera.position.x+=((still?0:px*.6)-camera.position.x)*.06;camera.lookAt(0,0,0);renderer.render(scene,camera);

   if(inView&&!document.hidden&&!still)frame=requestAnimationFrame(draw);

  };

  const resume=()=>{if(inView&&!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw);}};

  const resize=()=>{camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();renderer.setSize(container.clientWidth,container.clientHeight);resume();};

  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else resume();};

  const intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)resume();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:"100px"});if(embedded)intersection.observe(container);

  const observer=new ResizeObserver(resize);observer.observe(container);onScroll();resize();window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("pointermove",pointer,{passive:true});window.addEventListener("resize",resize);document.addEventListener("visibilitychange",visibility);reduced.addEventListener("change",resume);

  return()=>{intersection.disconnect();observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener("scroll",onScroll);window.removeEventListener("pointermove",pointer);window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibility);reduced.removeEventListener("change",resume);scene.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.LineSegments||obj instanceof THREE.Points){obj.geometry.dispose();(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};

 },[lightMode,paused,embedded]);

 return <div className={embedded?"nt-spatial-stage":"nt-spatial-world"} ref={host} aria-hidden="true"/>;

}

