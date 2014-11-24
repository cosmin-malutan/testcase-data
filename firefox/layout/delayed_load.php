<?php
  $counter = 5;
  if (isset($_GET['seconds'])) {
    $number = htmlspecialchars($_GET["seconds"]);
    if (is_numeric($number)) {
      // Check that the given value is between 0 and 5
      $counter = (0 <= $number && $number < $counter) ? $number : $counter;
    }
  }

  // Those settings are needed so the web-server will flush the content on the
  // fly instead of creating the whole page and sending it after executing
  ini_set("output_buffering", 0);
  ini_set("zlib.output_compression", 0);
  ini_set("implicit_flush", 1);
  echo str_repeat(" ", 1024);
?>
<!doctype html>
<html>
<head>
  <title>Mozilla</title>
</head>
<body>
  <h1>Slow loading test page</h1>
  <p>The page will finish loading in:</p>
  <?php
    for (; $counter > 0; $counter -= 1) {
      echo '<p id="seconds_' . $counter . '">' . $counter . '</p>';
      ob_flush();
      flush();
      sleep(1);
    }
  ?>
  <p id="content">Content</p>
</body>
</html>
