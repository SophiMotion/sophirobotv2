export function setupAppearanceLink(){
 const link=document.querySelector<HTMLAnchorElement>('[data-open-appearance]');
 link?.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const popup=window.open(link.href,'_blank','popup=yes,width=1500,height=1000');if(popup){popup.opener=null;event.preventDefault();}});
}
