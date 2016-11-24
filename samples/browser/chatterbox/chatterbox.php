<?php

// WARNING! This code is not part of Bravey and it's pretty insecure!

$_CONFIG["enabled"]=1; // 0 to disable.
$_CONFIG["cache"]="cache/";
$_CONFIG["cachemaxsize"]=52428800; // 10mb. 0 for unlimited size
$_CONFIG["cachemaxcount"]=5000; // 0 for unlimited entries
$_CONFIG["logs"]="logs/"; // Logs path. 0 for disabling.
$_CONFIG["allowedprefixes"]=[
	"http://api.football-data.org/", // FootBot
	"https://www.dati.lombardia.it/api/views/", // MuseumBot
	"http://pokeapi.co/api/", // OakBot
	"http://poetrydb.org/", // PoetBot
	"http://services.faa.gov/airport/", // WeatherBot
	"http://zxart.ee/api/", // ZxArtBot
];

$valid=false;
if ($_CONFIG["enabled"]) {
	if (!is_dir($_CONFIG["cache"])) mkdir($_CONFIG["cache"]);
	if ($_CONFIG["logs"]&&!is_dir($_CONFIG["logs"])) mkdir($_CONFIG["logs"]);

	$logline="";
	if (isset($_POST["method"])&&isset($_POST["url"])) {
		for ($i=0;$i<count($_CONFIG["allowedprefixes"]);$i++)
			if (substr($_POST["url"], 0, strlen($_CONFIG["allowedprefixes"][$i]))==$_CONFIG["allowedprefixes"][$i]) {
				$valid=true;
				break;
			}
		if ($valid) {		
	    	$urlhash=$_POST["method"].":".$_POST["url"].":";
			$opts = array(
			  'http'=>array(
			    'method'=>$_POST["method"]
			  )
			);
			if (isset($_POST["header"])) {
				$opts["http"]["header"]="";
				$heads=json_decode($_POST["header"],true);
				foreach ($heads as $key=>$value) {
					$opts["http"]["header"].=$key.": ".$value."\r\n";
					$urlhash.=$key.":".$value.":";
				}
			}
			$logline.="[".$urlhash."] => ";
			$urlhash=$_CONFIG["cache"].md5($urlhash);
			$logline.=" [".$urlhash."] ";
			if (is_file($urlhash)) {
				$logline="[OK] [cached] ".$logline;
				echo(file_get_contents($urlhash));
			}
			else {			
				$size=0;
				$count=0;
			    $dir = opendir($_CONFIG["cache"]);
			    if ($dir) {
			    	while (($file = readdir($dir)) !== false) {
				        if (($file == '.')||$file == '..') continue;
				        $count++;
			 			$size+=filesize($_CONFIG["cache"].$file);
			    	}
			    	closedir($dir);
			    	if ($_CONFIG["cachemaxsize"]&&($size>$_CONFIG["cachemaxsize"])) {
			    		$logline="[WARN] [cachesizefull] ".$logline;
			    		$valid=false;
			    	}
			    	if ($_CONFIG["cachemaxcount"]&&($count>$_CONFIG["cachemaxcount"])) {
			    		$logline="[WARN] [cachecountfull] ".$logline;
			    		$valid=false;
			    	}
			    	if ($valid) {
			    		$logline="[OK] [downloading] ".$logline;
						$context = stream_context_create($opts);
						$data=file_get_contents($_POST["url"], false, $context);
						file_put_contents($urlhash, $data);
						echo $data;
					}
				} else $valid=false;
			}

			if ($_CONFIG["logs"]) {
				$log=fopen($_CONFIG["logs"]."braveyproxy-".date("Y-m-d").".log","a");
				fwrite($log, "[".date("Y/m/d H:i:s")."] - ".$_SERVER['REMOTE_ADDR']." (".$_SERVER['HTTP_USER_AGENT'].") - ".$logline."\n");
				fclose($log);
			}

		}
	}
}

if (!$valid) echo "*NO*";
?>