(()=>{
 const dialog=document.querySelector('#application-dialog'),form=document.querySelector('#candidate-form');if(!dialog||!form)return;
 const field=name=>form.elements.namedItem(name),$=selector=>dialog.querySelector(selector),steps=[...dialog.querySelectorAll('.form-step')];
 const roles={parents:['mother','father'],mother:['mother'],father:['father'],guardian:['guardian']},roleNames={mother:'Anne',father:'Baba',guardian:'Veli / Vasi'};
 let settings,city,step=0,requestId,submitting=false,branchCaption='';
 const money=value=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(value);
 function message(value=''){const el=$('#form-message');el.textContent=value;el.hidden=!value}
 function option(select,value,label){const item=document.createElement('option');item.value=value;item.textContent=label;select.append(item)}
 function setStep(index){step=index;steps.forEach((el,i)=>{el.hidden=i!==index});dialog.querySelectorAll('.form-progress li').forEach((el,i)=>{el.classList.toggle('is-active',i===index);if(i===index)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});$('#form-back').hidden=index===0;$('#form-next').hidden=index===3;$('#form-submit').hidden=index!==3;dialog.scrollTop=0;if(index===3)updateFee()}
 function branchOptions(selected=''){const group=settings.groups.find(item=>item.id===field('group').value);field('branch').replaceChildren();option(field('branch'),'','Sınav / alt branş seçin');group?.branches.forEach(branch=>option(field('branch'),branch.id,branch.id===selected&&branchCaption?branchCaption:branch.name));field('branch').value=selected;updateFee()}
 function groupOptions(selected='',branch=''){field('group').replaceChildren();option(field('group'),'','Ana başlık seçin');settings.groups.forEach(group=>option(field('group'),group.id,group.id==='sanat'?'Dans ve Senfoni Orkestra Sınavları':group.name));field('group').value=selected;branchOptions(branch)}
 function updateFee(){const group=settings?.groups.find(item=>item.id===field('group').value),branch=group?.branches.find(item=>item.id===field('branch').value),type=field('feeType').value,fee=type==='candidate'?branch?.candidateFee:branch?.registrationFee;
  $('#fee-label').textContent=type==='candidate'?'Adaylık ücreti':'Kesin kayıt ücreti';$('#application-fee').textContent=fee==null?'Henüz açılmadı':money(fee);$('#fee-selection').textContent=[city?.name,branch?.name].filter(Boolean).join(' · ');$('#payment-instructions').textContent=settings?.paymentInstructions||'';
  $('#form-submit').disabled=submitting||!settings?.accepting||fee==null;
 }
 function renderFamily(){const active=roles[field('familyMode').value];for(const box of $('#family-fields').children){const enabled=active.includes(box.dataset.role);box.hidden=!enabled;box.disabled=!enabled}field('primaryContact').replaceChildren();active.forEach(role=>option(field('primaryContact'),role,roleNames[role]))}
 for(const role of ['mother','father','guardian']){
  const box=document.createElement('fieldset');box.className='contact-fields';box.dataset.role=role;
  box.innerHTML='<legend>'+roleNames[role]+' bilgileri</legend><div class="form-grid"><label class="form-wide">Adı soyadı<input name="'+role+'Name" maxlength="160" required></label>'+(role==='guardian'?'<label class="form-wide">Yakınlığı<select name="guardianRelationship" required><option value="">Seçin</option><option>Vasi</option><option>Büyükanne / Büyükbaba</option><option>Abla / Ağabey</option><option>Teyze / Hala</option><option>Amca / Dayı</option><option>Diğer yasal veli</option></select></label>':'')+'<label>Mesleği<input name="'+role+'Occupation" maxlength="100" required></label><label>Telefonu<input name="'+role+'Phone" type="tel" maxlength="30" required></label><label class="form-wide">E-posta <small>Varsa</small><input name="'+role+'Email" type="email" maxlength="150"></label></div>';
  $('#family-fields').append(box);
 }
 field('familyMode').addEventListener('change',renderFamily);field('group').addEventListener('change',()=>{branchCaption='';branchOptions()});field('branch').addEventListener('change',updateFee);field('feeType').addEventListener('change',updateFee);
 form.addEventListener('change',event=>{if(event.target.name==='paid'){const paid=field('paid').value==='yes';$('#receipt-field').hidden=!paid;field('receipt').required=paid;if(!paid)field('receipt').value=''}});
 function currentValid(){for(const control of steps[step].querySelectorAll('input,select,textarea')){if(!control.disabled&&!control.checkValidity()){control.reportValidity();return false}}if(step===0){const branch=settings.groups.find(item=>item.id===field('group').value)?.branches.find(item=>item.id===field('branch').value);if(!settings.accepting){message('Başvurular henüz açılmadı.');return false}if((field('feeType').value==='candidate'?branch?.candidateFee:branch?.registrationFee)==null){message('Seçtiğiniz başvuru türü henüz açılmadı.');return false}}return true}
 $('#form-next').addEventListener('click',()=>{message();if(currentValid())setStep(step+1)});$('#form-back').addEventListener('click',()=>{message();setStep(Math.max(0,step-1))});
 function close(){if(!submitting)dialog.close()}
 $('.dialog-close').addEventListener('click',close);$('#form-done').addEventListener('click',close);dialog.addEventListener('click',event=>{if(event.target===dialog)close()});dialog.addEventListener('cancel',event=>{if(submitting)event.preventDefault()});
 window.openNovaApplication=async(selectedCity,selectedGroup,selectedBranch)=>{
  try{const response=await fetch(window.novaApplicationEndpoint('/api/applications/config'),{cache:'no-store'}),result=await response.json();if(!response.ok)throw Error(result.error||'Başvuru bilgileri alınamadı.');if(!result.ready)throw Error('Başvuru sistemi henüz açılmadı. Lütfen daha sonra tekrar deneyin.');settings=result.settings;city=selectedCity;form.reset();requestId=crypto.randomUUID();renderFamily();const group=settings.groups.find(item=>item.id===selectedGroup),patterns={dance:/dans|halk oyun|bale/i,symphony:/senfoni|orkestra/i,stage:/sahne|tiyatro/i},preferred=selectedBranch?group?.branches.find(item=>item.id===selectedBranch)||group?.branches.find(item=>patterns[selectedBranch]?.test(item.name)):null;branchCaption=({dance:'DANS',symphony:'SENFONİ ORKESTRASI',stage:'SAHNE SANATLARI'})[selectedBranch]||'';groupOptions(selectedGroup,preferred?.id||'');message();$('#form-fields').hidden=false;$('#form-success').hidden=true;$('#dialog-city').textContent=city.name;field('dob').max=new Date().toISOString().slice(0,10);$('#receipt-field').hidden=true;field('receipt').required=false;setStep(0);dialog.showModal();field('group').focus();}
  catch(error){window.alert(error.message)}
 };
 form.noValidate=true;
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting)return;if(step!==3){if(currentValid())setStep(step+1);return}
  message();for(let i=0;i<4;i++){setStep(i);if(!currentValid())return}setStep(3);
  const file=field('receipt').files[0];if(field('paid').value==='yes'&&(!file||file.size>5*1024*1024||!file.name.toLowerCase().endsWith('.pdf'))){message('En fazla 5 MB boyutunda PDF dekont yükleyin.');return}
  const candidate={};for(const name of ['firstName','lastName','dob','tc','passport','nationality','gender','phone','email','province','district','address','school','grade'])candidate[name]=field(name).value.trim();
  const data={requestId,revision:settings.revision,city:city.id,group:field('group').value,branch:field('branch').value,feeType:field('feeType').value,candidate,familyMode:field('familyMode').value,primaryContact:field('primaryContact').value,contacts:roles[field('familyMode').value].map(role=>({role,fullName:field(role+'Name').value.trim(),relationship:role==='guardian'?field('guardianRelationship').value:roleNames[role],occupation:field(role+'Occupation').value.trim(),phone:field(role+'Phone').value.trim(),email:field(role+'Email').value.trim()})),paid:field('paid').value==='yes',confirmation:field('confirmation').checked};
  const body=new FormData();body.append('data',JSON.stringify(data));if(data.paid&&file)body.append('receipt',file);
  submitting=true;$('#form-submit').disabled=true;$('#form-submit').textContent='Gönderiliyor…';$('#form-back').disabled=true;
  try{const response=await fetch(window.novaApplicationEndpoint('/api/applications'),{method:'POST',body}),result=await response.json();if(!response.ok){if(response.status===409){const fresh=await fetch(window.novaApplicationEndpoint('/api/applications/config'),{cache:'no-store'});if(fresh.ok){settings=(await fresh.json()).settings;groupOptions(data.group,data.branch);setStep(0)}}throw Error(result.error||'Başvuru gönderilemedi.')}$('#form-fields').hidden=true;$('#form-success').hidden=false;$('#application-reference').textContent=result.id;dialog.scrollTop=0;$('#form-done').focus()}
  catch(error){message(error.message||'Bağlantı kurulamadı. Bilgileriniz formda duruyor; tekrar deneyebilirsiniz.')}
  finally{submitting=false;$('#form-submit').textContent='Başvuruyu gönder';$('#form-back').disabled=false;updateFee()}
 });
 renderFamily();
})();
