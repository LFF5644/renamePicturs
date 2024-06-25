#!/usr/bin/env node

const exif=require("exif");
const fs=require("fs");

const allowedImgTypes=[
	".jpeg",
	".jpg",
	".png",
];
const allowedMovTypes=[
	".avi",
	".mov",
	".mp4",
];
const wait_str="⌛";
const error_str="❌"; // ❎ ✖️ 🔴
const check_str="✅"; // ✔️ ☑️ 🟢

function lstatPromise(file){return new Promise((resolve,reject)=>{
	fs.lstat(file,(err,stats)=>{
		if(err){
			reject(err);
			return;
		}
		resolve(stats);
	});
})}
function existsPromise(file){return new Promise(resolve=>{
	fs.exists(file,resolve);
})}
function rmPromise(file){return new Promise(resolve=>{
	fs.rm(file,resolve);
})}
function copyFilePromise(file,newFile){return new Promise(resolve=>{
	fs.copyFile(file,newFile,resolve);
})}
function getImageExifData(image){return new Promise((resolve,reject)=>{
	exif.ExifImage({image},(error,exifData)=>{
		if(error){
			console.log("Fehler beim Öffnen der Bilddatei!");
			console.log(error);
			reject(error);
		}
		resolve(exifData);
	});
})}
async function getImageCreateDate(image){
	const exifData=await getImageExifData(image);

	let [date,time]=exifData.exif.CreateDate.split(" ");
	date=date.split(":").join(".");
	return [date,time];
}
function includesParameter(parameter){
	return (
		parameters.some(item=>
			item.startsWith("--")&&
			item.substring(2).toLowerCase()===parameter.toLocaleLowerCase()
		)||
		(
			input.startsWith("--")&&
			input.substring(2).toLowerCase()===parameter.toLocaleLowerCase()
		)||
		(
			output.startsWith("--")&&
			output.substring(2).toLowerCase()===parameter.toLocaleLowerCase()
		)
	);
}

const [_node,_thisFile,input,output="output",...parameters]=process.argv;

(async()=>{
	if(includesParameter("help")){
		console.log("Help:\n[pictures folder] [output folder] [...parameters]");
		console.log("--help => Zeigt diese Hilfe liste an.");
		console.log("--delete => Löscht Original Bilddateien.");
		process.exit(0);
	}

	if(!input||!await existsPromise(input)){
		console.log("Pictures Folder not found or given!");
		process.exit(1);
	}

	console.log(wait_str+" Search images...");

	const pictures=[];
	let dirs=[];
	let items=fs.readdirSync(input).map(item=>input+"/"+item);
	
	while(items.length){
		for(const item of items){
			const lstat=await lstatPromise(item);
			const isFile=lstat.isFile();
			const isDirectory=lstat.isDirectory();
			if(
				isFile&&
				allowedImgTypes.some(itemExtension=>item.toLocaleLowerCase().endsWith(itemExtension))
			){
				pictures.push(item);
			}
			else if(isDirectory){
				dirs.push(item);
			}


		}
		items=[];
		for(const dir of dirs){
			console.log("Open subfolder: "+dir);
			items.push(...fs.readdirSync(dir).map(item=>dir+"/"+item));
		}
		dirs=[];
	}
	console.log(check_str+" Images search completed "+pictures.length+" images found!\n");
	
	console.log(wait_str+" Start copy images...");
	try{fs.mkdirSync(output)}catch(e){}

	const promises=[];
	let completed=0;
	let fails=[];
	for(const picture of pictures){
		const date=await getImageCreateDate(picture);
		const extension="."+picture.split(".").pop(".").toLowerCase();
		const newFilename=date[0].split(".").join("")+"_"+date[1].split(":").join("")+extension;
		const newOutput=output+"/"+newFilename;
		
		console.log(wait_str+" Copy image "+picture+" => "+newOutput);
		promises.push(new Promise(async resolve=>{
			/*const readStream=fs.createReadStream(picture);
			const writeStream=fs.createWriteStream(newOutput);
			readStream.on("data",buffer=>{
				writeStream.write(buffer);
			});
			readStream.on("close",()=>{
				writeStream.close();
				completed+=1;
				console.log(check_str+` Image copied ${completed}/${pictures.length}`);
				resolve();
			})*/
			if(await existsPromise(newOutput)){
				console.log(error_str+" File "+newOutput+" already exists! Action canceled!");
				fails.push([picture,"Output file already exists!"]);
				resolve(false);
				return;
			}
			await copyFilePromise(picture,newOutput);
			console.log(check_str+` Image copied ${newOutput}`);
			
			if(includesParameter("delete")){
				console.log(wait_str+" "+picture+" deleting...");
				await rmPromise(picture);
				console.log(check_str+" "+picture+" deleted!");
			}
			completed+=1;
			console.log(check_str+` ${completed}/${pictures.length} completed. ${picture} => ${newOutput} completed.`);

			resolve(true);
		}));
	}
	await Promise.all(promises);
	console.log("\n"+check_str+" All finish!");
	if(fails.length){
		console.log(error_str+" Some skipped/failed pictures found!");
		for(const [picture,reason] of fails){
			console.log(error_str+` "${picture}" reason: ${reason}`);
		}
		console.log(error_str+" "+fails.length+" Fails!");
	}
	else{
		console.log(check_str+" None fails all successful completed!");
	}
})();
