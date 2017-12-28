<?php
use PrivateBin\I18n;
?><!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="robots" content="noindex" />
		<meta name="referrer" content="no-referrer">
		<title><?php echo I18n::_($NAME); ?></title>
		<link type="text/css" rel="stylesheet" href="css/privatebin.css?<?php echo rawurlencode($VERSION); ?>" />
<?php
if ($SYNTAXHIGHLIGHTING):
?>
		<link type="text/css" rel="stylesheet" href="css/prettify/prettify.css?<?php echo rawurlencode($VERSION); ?>" />
<?php
    if (strlen($SYNTAXHIGHLIGHTINGTHEME)):
?>
		<link type="text/css" rel="stylesheet" href="css/prettify/<?php echo rawurlencode($SYNTAXHIGHLIGHTINGTHEME); ?>.css?<?php echo rawurlencode($VERSION); ?>" />
<?php
    endif;
endif;
?>
		<script type="text/javascript" src="js/jquery-3.1.1.js" integrity="sha512-U6K1YLIFUWcvuw5ucmMtT9HH4t0uz3M366qrF5y4vnyH6dgDzndlcGvH/Lz5k8NFh80SN95aJ5rqGZEdaQZ7ZQ==" crossorigin="anonymous"></script>
		<script type="text/javascript" src="js/sjcl-1.0.6.js" integrity="sha512-DsyxLV/uBoQlRTJmW5Gb2SxXUXB+aYeZ6zk+NuXy8LuLyi8oGti9AGn6He5fUY2DtgQ2//RjfaZog8exFuunUQ==" crossorigin="anonymous"></script>
<?php
if ($ZEROBINCOMPATIBILITY):
?>
		<script type="text/javascript" src="js/base64-1.7.js" integrity="sha512-JdwsSP3GyHR+jaCkns9CL9NTt4JUJqm/BsODGmYhBcj5EAPKcHYh+OiMfyHbcDLECe17TL0hjXADFkusAqiYgA==" crossorigin="anonymous"></script>
<?php
else:
?>
		<script type="text/javascript" src="js/base64-2.1.9.js" integrity="sha512-rbqAby7hObftbEoGQzkhUbEh5YkUn2MtekTLs4btvo2oly4CZ3DxhJzEh0u/rNzS54tcJdqi5Ug1ruugEd2U1g==" crossorigin="anonymous"></script>
<?php
endif;
?>
		<script type="text/javascript" src="js/rawdeflate-0.5.js" integrity="sha512-tTdZ7qMr7tt5VQy4iCHu6/aGB12eRwbUy+AEI5rXntfsjcRfBeeqJloMsBU9FrGk1bIYLiuND/FhU42LO1bi0g==" crossorigin="anonymous"></script>
		<script type="text/javascript" src="js/rawinflate-0.3.js" integrity="sha512-g8uelGgJW9A/Z1tB6Izxab++oj5kdD7B4qC7DHwZkB6DGMXKyzx7v5mvap2HXueI2IIn08YlRYM56jwWdm2ucQ==" crossorigin="anonymous"></script>
<?php
if ($SYNTAXHIGHLIGHTING):
?>
		<script type="text/javascript" src="js/prettify.js?<?php echo rawurlencode($VERSION); ?>" integrity="sha512-m8iHxoN+Fe12xxFwWNdY/TS4KoFntHp29qY0xUzBnPd0bkKMOR/dFhEdTWydpt0b/fIXyhB+znGYUvgjfJ2RzQ==" crossorigin="anonymous"></script>
<?php
endif;
if ($MARKDOWN):
?>
		<script type="text/javascript" src="js/showdown-1.6.1.js" integrity="sha512-e6kAsBTgFnTBnEQXrq8BV6+XFwxb3kyWHeEPOl+KhxaWt3xImE2zAW2+yP3E2CQ7F9yoJl1poVU9qxkOEtVsTQ==" crossorigin="anonymous"></script>
		<script type="text/javascript" src="js/purify.min.js?<?php echo rawurlencode($VERSION); ?>" integrity="sha512-jJuy143F5Oy7oS3VkjzeJGBxIUuQ1H0eSjuvLGD3FiQzeu8Pwp5vI/jQ2dxlxSrzejmNMicdLHnIqH7R8Ft0lQ==" crossorigin="anonymous"></script>
<?php
endif;
?>
		<script type="text/javascript" src="js/privatebin.js?<?php echo rawurlencode($VERSION); ?>" integrity="sha512-EvNAh1GXOoUiGZ/W8iPtzsce06bvVHy6+ajJztmfSgdQcKMPoj0dB8j1FC90MEChl7MOeR4xozvDymH/6HwIlA==" crossorigin="anonymous"></script>
		<!--[if lt IE 10]>
		<style type="text/css">body {padding-left:60px;padding-right:60px;} #ienotice {display:block;} #oldienotice {display:block;}</style>
		<![endif]-->
		<link rel="apple-touch-icon" href="img/apple-touch-icon.png?<?php echo rawurlencode($VERSION); ?>" sizes="180x180" />
		<link rel="icon" type="image/png" href="img/favicon-32x32.png?<?php echo rawurlencode($VERSION); ?>" sizes="32x32" />
		<link rel="icon" type="image/png" href="img/favicon-16x16.png?<?php echo rawurlencode($VERSION); ?>" sizes="16x16" />
		<link rel="manifest" href="manifest.json?<?php echo rawurlencode($VERSION); ?>" />
		<link rel="mask-icon" href="img/safari-pinned-tab.svg?<?php echo rawurlencode($VERSION); ?>" color="#ffcc00" />
		<link rel="shortcut icon" href="img/favicon.ico">
		<meta name="msapplication-config" content="browserconfig.xml">
		<meta name="theme-color" content="#ffe57e" />
	</head>
	<body>
		<header>
			<div id="aboutbox">
				<?php echo I18n::_('%s is a minimalist, open source online pastebin where the server has zero knowledge of pasted data. Data is encrypted/decrypted <i>in the browser</i> using 256 bits AES. More information on the <a href="https://privatebin.info/">project page</a>.', I18n::_($NAME)); ?><br />
<?php
if (strlen($NOTICE)):
?>
				<span class="blink">▶</span> <?php echo htmlspecialchars($NOTICE);
endif;
?>
			</div>
			<h1 class="title reloadlink"><?php echo I18n::_($NAME); ?></h1><br />
			<h2 class="title"><?php echo I18n::_('Because ignorance is bliss'); ?></h2><br />
			<h3 class="title"><?php echo $VERSION; ?></h3>
			<noscript><div id="noscript" class="nonworking"><?php echo I18n::_('JavaScript is required for %s to work.<br />Sorry for the inconvenience.', I18n::_($NAME)); ?></div></noscript>
			<div id="oldienotice" class="nonworking"><?php echo I18n::_('%s requires a modern browser to work.', I18n::_($NAME)); ?></div>
			<div id="ienotice"><?php echo I18n::_('Still using Internet Explorer? Do yourself a favor, switch to a modern browser:'), PHP_EOL; ?>
				<a href="https://www.mozilla.org/firefox/">Firefox</a>,
				<a href="https://www.opera.com/">Opera</a>,
				<a href="https://www.google.com/chrome">Chrome</a>…
			</div>
		</header>
		<section>
			<article>
				<div id="loadingindicator" class="hidden"><?php echo I18n::_('Loading…'); ?></div>
				<div id="status"><?php echo htmlspecialchars($STATUS); ?></div>
				<div id="errormessage" class="hidden"><?php echo htmlspecialchars($ERROR); ?></div>
				<div id="toolbar">
					<button id="newbutton" class="reloadlink hidden"><img src="img/icon_new.png" width="11" height="15" alt="" /><?php echo I18n::_('New'); ?></button>
					<button id="sendbutton" class="hidden"><img src="img/icon_send.png" width="18" height="15" alt="" /><?php echo I18n::_('Send'); ?></button>
<?php
if ($EXPIRECLONE):
?>
					<button id="clonebutton" class="hidden"><img src="img/icon_clone.png" width="15" height="17" alt="" /><?php echo I18n::_('Clone'); ?></button>
<?php
endif;
?>
					<button id="rawtextbutton" class="hidden"><img src="img/icon_raw.png" width="15" height="15" alt="" /><?php echo I18n::_('Raw text'); ?></button>
					<div id="expiration" class="hidden button"><?php echo I18n::_('Expires'); ?>:
						<select id="pasteExpiration" name="pasteExpiration">
<?php
foreach ($EXPIRE as $key => $value):
?>
							<option value="<?php echo $key; ?>"<?php
    if ($key == $EXPIREDEFAULT):
?> selected="selected"<?php
    endif;
?>><?php echo $value; ?></option>
<?php
endforeach;
?>
						</select>
					</div>
					<div id="remainingtime" class="hidden"></div>
					<div id="burnafterreadingoption" class="button hidden">
						<input type="checkbox" id="burnafterreading" name="burnafterreading"<?php
if ($BURNAFTERREADINGSELECTED):
?> checked="checked"<?php
endif;
?> />
						<label for="burnafterreading"><?php echo I18n::_('Burn after reading'); ?></label>
					</div>
<?php
if ($DISCUSSION):
?>
					<div id="opendiscussionoption" class="button hidden">
						<input type="checkbox" id="opendiscussion" name="opendiscussion"<?php
    if ($OPENDISCUSSION):
?> checked="checked"<?php
    endif;
?> />
						<label for="opendiscussion" <?php
    if (!$OPENDISCUSSION):
?> style="color: #BBBBBB;"<?php
    endif;
?>><?php echo I18n::_('Open discussion'); ?></label>
					</div>
<?php
endif;
if ($PASSWORD):
?>
					<div id="password" class="hidden">
						<input type="password" id="passwordinput" placeholder="<?php echo I18n::_('Password (recommended)'); ?>" size="32" />
					</div>
<?php
endif;
?>
					<div id="formatter" class="button hidden"><?php echo I18n::_('Format'); ?>:
						<select id="pasteFormatter" name="pasteFormatter">
<?php
foreach ($FORMATTER as $key => $value):
?>
							<option value="<?php echo $key; ?>"<?php
    if ($key == $FORMATTERDEFAULT):
?> selected="selected"<?php
    endif;
?>><?php echo $value; ?></option>
<?php
endforeach;
?>
						</select>
					</div>
<?php
if (strlen($LANGUAGESELECTION)):
?>
					<div id="language" class="button">
						<select name="lang">
<?php
    foreach ($LANGUAGES as $key => $value):
?>
							<option data-lang="<?php echo $key; ?>" value="<?php echo $key; ?>"<?php
        if ($key == $LANGUAGESELECTION):
?> selected="selected"<?php
        endif;
?>><?php echo $value[0]; ?> (<?php echo $value[1]; ?>)</option>
<?php
    endforeach;
?>
						</select>
					</div>
<?php
endif;
?>
				</div>
				<div id="pastesuccess" class="hidden">
					<div id="deletelink"></div>
					<div id="pastelink">
<?php
if (strlen($URLSHORTENER)):
?>
						<button id="shortenbutton" data-shortener="<?php echo htmlspecialchars($URLSHORTENER); ?>"><img src="img/icon_shorten.png" width="13" height="15" /><?php echo I18n::_('Shorten URL'); ?></button>
<?php
endif;
?>
					</div>
				</div>
<?php
if ($FILEUPLOAD):
?>
				<div id="attachment" class="hidden"><a><?php echo I18n::_('Download attachment'); ?></a></div>
				<div id="attach" class="hidden">
					<span id="clonedfile" class="hidden"><?php echo I18n::_('Cloned file attached.'); ?></span>
					<span id="filewrap"><?php echo I18n::_('Attach a file'); ?>: <input type="file" id="file" name="file" /></span>
					<button id="fileremovebutton"><?php echo I18n::_('Remove attachment'); ?></button>
				</div>
<?php
endif;
?>
				<div id="preview" class="hidden">
					<button id="messageedit"><?php echo I18n::_('Editor'); ?></button>
					<button id="messagepreview"><?php echo I18n::_('Preview'); ?></button>
				</div>
				<div id="image" class="hidden"></div>
				<div id="prettymessage" class="hidden">
					<pre id="prettyprint" class="prettyprint linenums:1"></pre>
				</div>
				<div id="plaintext" class="hidden"></div>
				<textarea id="message" name="message" cols="80" rows="25" class="hidden"></textarea>
			</article>
		</section>
		<section>
			<div id="discussion" class="hidden">
				<h4 class="title"><?php echo I18n::_('Discussion'); ?></h4>
				<div id="commentcontainer"></div>
			</div>
		</section>
		<div id="serverdata" class="hidden" aria-hidden="true">
			<div id="cipherdata" class="hidden"><?php echo htmlspecialchars($CIPHERDATA, ENT_NOQUOTES); ?></div>
<?php
if ($DISCUSSION):
?>
			<div id="templates">
				<!-- @TODO: when I intend/structure this corrrectly Firefox adds whitespaces everywhere which completly destroy the layout. (same possible when you remove the template data below and show this area in the browser) -->
				<article id="commenttemplate" class="comment"><div class="commentmeta"><span class="nickname">name</span><span class="commentdate">0000-00-00</span></div><div class="commentdata">c</div><button class="btn btn-default btn-sm"><?php echo I18n::_('Reply'); ?></button></article>
				<div id="commenttailtemplate" class="comment"><button class="btn btn-default btn-sm"><?php echo I18n::_('Add comment'); ?></button></div>
				<div id="replytemplate" class="reply hidden"><input type="text" id="nickname" class="form-control" title="<?php echo I18n::_('Optional nickname…'); ?>" placeholder="<?php echo I18n::_('Optional nickname…'); ?>" /><textarea id="replymessage" class="replymessage form-control" cols="80" rows="7"></textarea><br /><div id="replystatus" role="alert" class="statusmessage hidden alert"><span class="glyphicon" aria-hidden="true"></span> </div><button id="replybutton" class="btn btn-default btn-sm"><?php echo I18n::_('Post comment'); ?></button></div>
			</div>
<?php
endif;
?>
		</div>
        <section class="container">
			<div id="noscript" role="alert" class="nonworking alert alert-info noscript-hide"><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true">
				<span> <?php echo I18n::_('Loading…'); ?></span><br>
				<span class="small"><?php echo I18n::_('In case this message never disappears please have a look at <a href="https://github.com/PrivateBin/PrivateBin/wiki/FAQ#why-does-not-the-loading-message-go-away">this FAQ for information to troubleshoot</a>.'); ?></span>
			</div>
		</section>
	</body>
</html>
