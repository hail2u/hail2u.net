#!/usr/bin/env perl

# Blosxom
# Author: Rael Dornfest (2002-2003), The Blosxom Development Team (2005-2010)
# Version: 2.1.2 ($Id: blosxom.cgi,v 1.98 2009/07/19 17:18:37 xtaran Exp $)
# Home/Docs/Licensing: http://blosxom.sourceforge.net/
# Development/Downloads: http://sourceforge.net/projects/blosxom

package blosxom;

=head1 NAME

blosxom - A lightweight yet feature-packed weblog

=head1 SYNOPSIS

B<blosxom> is a simple web log (blog) CGI script written in perl.

=head1 DESCRIPTION

B<Blosxom> (pronounced "I<blossom>") is a lightweight yet feature-packed
weblog application designed from the ground up with simplicity,
usability, and interoperability in mind.

Fundamental is its reliance upon the file system, folders and files
as its content database. Blosxom's weblog entries are plain text
files like any other. Write from the comfort of your favorite text
editor and hit the Save button. Create, edit, rename, and delete entries
on the command-line, via FTP, WebDAV, or anything else you
might use to manipulate your files. There's no import or export; entries
are nothing more complex than title on the first line, body being
everything thereafter.

Despite its tiny footprint, Blosxom doesn't skimp on features, sporting
the majority of features one would find in any other Weblog application.

Blosxom is simple, straightforward, minimalist Perl affording even the
dabbler an opportunity for experimentation and customization. And
last, but not least, Blosxom is open source and free for the taking and
altering.

=head1 USAGE

Write a weblog entry, and place it into the main data directory. Place
the the title is on the first line; the body is everything afterwards.
For example, create a file named I<first.txt> and put in it something
like this:

  First Blosxom Post!

  I have successfully installed blosxom on this system.  For more
  information on blosxom, see the author's <a
  href="http://blosxom.sourceforge.net/">blosxom site</a>.

Place the file in the directory under the I<$datadir> points to. Be
sure to change the default location to be somewhere accessable by the
web server that runs blosxom as a CGI program.

=cut

# --- Configurable variables -----

# What's this blog's title?
$blog_title = "My Weblog";

# What's this blog's description (for outgoing RSS feed)?
$blog_description = "Yet another Blosxom weblog.";

# What's this blog's primary language (for outgoing RSS feed)?
$blog_language = "en";

# What's this blog's text encoding ?
$blog_encoding = "UTF-8";

# Where are this blog's entries kept?
$datadir = "/Library/WebServer/Documents/blosxom";

# What's my preferred base URL for this blog (leave blank for
# automatic)?
$url = "";

# Should I stick only to the datadir for items or travel down the
# directory hierarchy looking for items?  If so, to what depth?
#
# 0 = infinite depth (aka grab everything), 1 = datadir only,
# n = n levels down

$depth = 0;

# How many entries should I show on the home page?
$num_entries = 40;

# What file extension signifies a blosxom entry?
$file_extension = "txt";

# What is the default flavour?
$default_flavour = "html";

# Should I show entries from the future (i.e. dated after now)?
$show_future_entries = 0;

# Should date components of the path always be at the front?
# If this is disabled, the date components can appear anywhere in the
# url (but always directly after each other, in the year/month/day
# order). For example, /category/subcategory/2008/12/ (or even
# /category/2008/12/subcategory/) shows all posts in subcategory from
# December 2008.
$date_first_in_url = 0;

# Should I display the date template only when the actual date changes,
# not the date template? (Only needed if you're using conditionals
# within your date templates)
$date_break_on_date_string = 0;

# --- Plugins (Optional) -----

# File listing plugins blosxom should load (if empty blosxom will load
# all plugins in $plugin_dir and $plugin_path directories)
$plugin_list = "";

# Where are my plugins kept?
$plugin_dir = "";

# Where should my plugins keep their state information?
$plugin_state_dir = "$plugin_dir/state";

# Additional plugins location. A list of directories, separated by ';'
# on windows, ':' everywhere else.
$plugin_path = "";

# --- Static Rendering -----

# Where are this blog's static files to be created?
$static_dir = "/Library/WebServer/Documents/blog";

# What's my administrative password (you must set this for static
# rendering)?
$static_password = "";

# What flavours should I generate statically?
@static_flavours = qw/html rss/;

# Should I generate static date pages?
# 0 = no, 1 = yes
$static_date_pages = 1;

# Should I statically generate individual entries?
# 0 = no, 1 = yes
$static_entries = 0;

# --- Advanced Encoding Options -----

# Should I encode entities for xml content-types? (plugins can turn
# this off if they do it themselves)
$encode_xml_entities = 1;

# Should I encode 8 bit special characters, e.g. umlauts in URLs, e.g.
# convert an ISO-Latin-1 \"o to %F6? (off by default for now; plugins
# can change this, too)
$encode_8bit_chars = 0;

# RegExp matching all characters which should be URL encoded in links.
# Defaults to anything but numbers, letters, slash, colon, dash,
# underscore and dot.
$url_escape_re = qr([^-/a-zA-Z0-9:._]);

# --------------------------------

=head1 ENVIRONMENT

=over

=item B<BLOSXOM_CONFIG_FILE>

Points to the location of the configuration file. This will be
considered as first option, if it's set.


=item B<BLOSXOM_CONFIG_DIR>

The here named directory will be tried unless the above mentioned
environment variable is set and tested for a contained blosxom.conf
file.


=back


=head1 FILES

=over

=item B</usr/lib/cgi-bin/blosxom>

The CGI script itself. Please note that the location might depend on
your installation.

=item B</etc/blosxom/blosxom.conf>

The default configuration file location. This is rather taken as last
ressort if no other configuration location is set through environment
variables.

=back


=head1 AUTHOR

Rael Dornfest <rael@oreilly.com> was the original author of blosxom. The
development was picked up by a team of dedicated users of blosxom since
2005. See <I<http://blosxom.sourceforge.net/>> for more information.

=cut

use vars qw!
    $version
    $blog_title
    $blog_description
    $blog_language
    $blog_encoding
    $datadir
    $url
    %template
    $template
    $depth
    $num_entries
    $file_extension
    $default_flavour
    $static_or_dynamic
    $config_dir
    $plugin_list
    $plugin_path
    $plugin_dir
    $plugin_state_dir
    @plugins
    %plugins
    $static_dir
    $static_password
    @static_flavours
    $static_date_pages
    $static_entries
    $path_info_full
    $path_info
    $path_info_yr
    $path_info_mo
    $path_info_da
    $path_info_mo_num
    $flavour
    %month2num
    @num2month
    $interpolate
    $entries
    $output
    $header
    $show_future_entries
    $date_first_in_url
    %files
    %indexes
    %others
    $encode_xml_entities
    $encode_8bit_chars
    $url_escape_re
    $content_type
    $date_break_on_date_string
    !;

use strict;
use FileHandle;
use File::Find;
use File::stat;
use Time::Local;
use CGI qw/:standard :netscape/;

$version = "2.1.2+dev";

# Load configuration from $ENV{BLOSXOM_CONFIG_DIR}/blosxom.conf, if it exists
my $blosxom_config;
if ( $ENV{BLOSXOM_CONFIG_FILE} && -r $ENV{BLOSXOM_CONFIG_FILE} ) {
    $blosxom_config = $ENV{BLOSXOM_CONFIG_FILE};
    ( $config_dir = $blosxom_config ) =~ s! / [^/]* $ !!x;
}
else {
    for my $blosxom_config_dir ( $ENV{BLOSXOM_CONFIG_DIR}, '/etc/blosxom',
        '/etc' )
    {
        if ( -r "$blosxom_config_dir/blosxom.conf" ) {
            $config_dir     = $blosxom_config_dir;
            $blosxom_config = "$blosxom_config_dir/blosxom.conf";
            last;
        }
    }
}

# Load $blosxom_config
if ($blosxom_config) {
    if ( -r $blosxom_config ) {
        eval { require $blosxom_config }
            or warn "Error reading blosxom config file '$blosxom_config'"
            . ( $@ ? ": $@" : '' );
    }
    else {
        warn "Cannot find or read blosxom config file '$blosxom_config'";
    }
}

my $fh = new FileHandle;

%month2num = (
    nil => '00',
    Jan => '01',
    Feb => '02',
    Mar => '03',
    Apr => '04',
    May => '05',
    Jun => '06',
    Jul => '07',
    Aug => '08',
    Sep => '09',
    Oct => '10',
    Nov => '11',
    Dec => '12'
);
@num2month = sort { $month2num{$a} <=> $month2num{$b} } keys %month2num;

# Use the stated preferred URL or figure it out automatically. Set
# $url manually in the config section above if CGI.pm doesn't guess
# the base URL correctly, e.g. when called from a Server Side Includes
# document or so.
unless ($url) {
    $url = url();

    # Unescape %XX hex codes (from URI::Escape::uri_unescape)
    $url =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;

    # Support being called from inside a SSI document
    $url =~ s/^included:/http:/ if $ENV{SERVER_PROTOCOL} eq 'INCLUDED';

    # Remove PATH_INFO if it is set but not removed by CGI.pm. This
    # seems to happen when used with Apache's Alias directive or if
    # called from inside a Server Side Include document. If that
    # doesn't help either, set $url manually in the configuration.
    $url =~ s/\Q$ENV{PATH_INFO}\E$// if defined $ENV{PATH_INFO};

    # NOTE:
    #
    # There is one case where this code does more than necessary, too:
    # If the URL requested is e.g. http://example.org/blog/blog and
    # the base URL is correctly determined as http://example.org/blog
    # by CGI.pm, then this code will incorrectly normalize the base
    # URL down to http://example.org, because the same string as
    # PATH_INFO is part of the base URL, too. But this is such a
    # seldom case and can be fixed by setting $url in the config file,
    # too.
}

# The only modification done to a manually set base URL is to strip
# a trailing slash if present.

$url =~ s!/$!!;

# Drop ending any / from dir settings
$datadir    =~ s!/$!!;
$plugin_dir =~ s!/$!!;
$static_dir =~ s!/$!!;

# Fix depth to take into account datadir's path
$depth += ( $datadir =~ tr[/][] ) - 1 if $depth;

if (    !$ENV{GATEWAY_INTERFACE}
    and param('-password')
    and $static_password
    and param('-password') eq $static_password )
{
    $static_or_dynamic = 'static';
}
else {
    $static_or_dynamic = 'dynamic';
    param( -name => '-quiet', -value => 1 );
}

# Path Info Magic
# Take a gander at HTTP's PATH_INFO for optional blog name, archive yr/mo/day
my @path_info = split m{/}, path_info() || param('path');
$path_info_full = join '/', @path_info;    # Equivalent to $ENV{PATH_INFO}
shift @path_info;

# Flavour specified by ?flav={flav} or index.{flav}
$flavour = '';
if ( !( $flavour = param('flav') ) ) {
    if ( $path_info[$#path_info] =~ /(.+)\.(.+)$/ ) {
        $flavour = $2;
        pop @path_info if $1 eq 'index';
    }
}
$flavour ||= $default_flavour;

# Fix XSS in flavour name (CVE-2008-2236)
$flavour = blosxom_html_escape($flavour);

sub blosxom_html_escape {
    my $string = shift;
    my %escape = (
        '<' => '&lt;',
        '>' => '&gt;',
        '&' => '&amp;',
        '"' => '&quot;',
        "'" => '&apos;'
    );
    my $escape_re = join '|' => keys %escape;
    $string =~ s/($escape_re)/$escape{$1}/g;
    $string;
}

# Global variable to be used in head/foot.{flavour} templates
$path_info = '';

if (!$date_first_in_url) {
    # Add all @path_info elements to $path_info till we come to one that could be a year
    while ( $path_info[0] && $path_info[0] !~ /^(19|20)\d{2}$/ ) {
        $path_info .= '/' . shift @path_info;
    }
}

# Pull date elements out of path
if ( $path_info[0] && $path_info[0] =~ /^(19|20)\d{2}$/ ) {
    $path_info_yr = shift @path_info;
    if ($path_info[0]
        && ( $path_info[0] =~ /^(0\d|1[012])$/
            || exists $month2num{ ucfirst lc $path_info_mo } )
        )
    {
        $path_info_mo = shift @path_info;

        # Map path_info_mo to numeric $path_info_mo_num
        $path_info_mo_num
            = $path_info_mo =~ /^\d{2}$/
            ? $path_info_mo
            : $month2num{ ucfirst lc $path_info_mo };
        if ( $path_info[0] && $path_info[0] =~ /^[0123]\d$/ ) {
            $path_info_da = shift @path_info;
        }
    }
}

# Add remaining path elements to $path_info
$path_info .= '/' . join( '/', @path_info );

# Strip spurious slashes
$path_info =~ s!(^/*)|(/*$)!!g;

# Define standard template subroutine, plugin-overridable at Plugins: Template
$template = sub {
    my ( $path, $chunk, $flavour ) = @_;

    do {
        return join '', <$fh>
            if $fh->open("< $datadir/$path/$chunk.$flavour");
    } while ( $path =~ s/(\/*[^\/]*)$// and $1 );

    # Check for definedness, since flavour can be the empty string
    if ( defined $template{$flavour}{$chunk} ) {
        return $template{$flavour}{$chunk};
    }
    elsif ( defined $template{error}{$chunk} ) {
        return $template{error}{$chunk};
    }
    else {
        return '';
    }
};

# Bring in the templates
%template = ();
while (<DATA>) {
    last if /^(__END__)$/;
    my ( $ct, $comp, $txt ) = /^(\S+)\s(\S+)(?:\s(.*))?$/ or next;
    $txt =~ s/\\n/\n/mg;
    $template{$ct}{$comp} .= $txt . "\n";
}

# Plugins: Start
my $path_sep = $^O eq 'MSWin32' ? ';' : ':';
my @plugin_dirs = split /$path_sep/, $plugin_path;
unshift @plugin_dirs, $plugin_dir;
my @plugin_list = ();
my %plugin_hash = ();

# If $plugin_list is set, read plugins to use from that file
if ($plugin_list) {
    if ( -r $plugin_list and $fh->open("< $plugin_list") ) {
        @plugin_list = map { chomp $_; $_ } grep { /\S/ && !/^#/ } <$fh>;
        $fh->close;
    }
    else {
        warn "unable to read or open plugin_list '$plugin_list': $!";
        $plugin_list = '';
    }
}

# Otherwise walk @plugin_dirs to get list of plugins to use
if ( !@plugin_list && @plugin_dirs ) {
    for my $plugin_dir (@plugin_dirs) {
        next unless -d $plugin_dir;
        if ( opendir PLUGINS, $plugin_dir ) {
            for my $plugin (
                grep { /^[\w:]+$/ && !/~$/ && -f "$plugin_dir/$_" }
                readdir(PLUGINS) )
            {

                # Ignore duplicates
                next if $plugin_hash{$plugin};

                # Add to @plugin_list and %plugin_hash
                $plugin_hash{$plugin} = "$plugin_dir/$plugin";
                push @plugin_list, $plugin;
            }
            closedir PLUGINS;
        }
    }
    @plugin_list = sort @plugin_list;
}

# Load all plugins in @plugin_list
unshift @INC, @plugin_dirs;
foreach my $plugin (@plugin_list) {
    my ( $plugin_name, $off ) = $plugin =~ /^\d*([\w:]+?)(_?)$/;
    my $plugin_file = $plugin_list ? $plugin_name : $plugin;
    my $on_off = $off eq '_' ? -1 : 1;

    # Allow perl module plugins
    # The -z test is a hack to allow a zero-length placeholder file in a
    #   $plugin_path directory to indicate an @INC module should be loaded
    if ( $plugin =~ m/::/ && ( $plugin_list || -z $plugin_hash{$plugin} ) ) {

     # For Blosxom::Plugin::Foo style plugins, we need to use a string require
        eval "require $plugin_file";
    }
    else
    { # we try first to load from $plugin_dir before attempting from $plugin_path
        eval        { require "$plugin_dir/$plugin_file" }
            or eval { require $plugin_file };
    }

    if ($@) {
        warn "error finding or loading blosxom plugin '$plugin_name': $@";
        next;
    }
    if ( $plugin_name->start() and ( $plugins{$plugin_name} = $on_off ) ) {
        push @plugins, $plugin_name;
    }

}
shift @INC foreach @plugin_dirs;

# Plugins: Template
# Allow for the first encountered plugin::template subroutine to override the
# default built-in template subroutine
foreach my $plugin (@plugins) {
    if ( $plugins{$plugin} > 0 and $plugin->can('template') ) {
        if ( my $tmp = $plugin->template() ) {
            $template = $tmp;
            last;
        }
    }
}

# Provide backward compatibility for Blosxom < 2.0rc1 plug-ins
sub load_template {
    return &$template(@_);
}

# Define default entries subroutine
$entries = sub {
    my ( %files, %indexes, %others );
    my $param_all = param('-all');
    find(
        sub {
            my $curr_depth = $File::Find::dir =~ tr[/][];
            return if $depth and $curr_depth > $depth;
            return if !-r $File::Find::name;

            # if a $file_extension file and not a .file or an index
            if ( m/^([^.].*)\.$file_extension$/
                and $1 ne 'index' )
            {
                my $basename_noext = $1;

                # read modification time
                my $mtime = stat($File::Find::name)->mtime or return;

                # to show or not to show future entries
                return unless ( $show_future_entries or $mtime < time );

                # add the file and its associated mtime to the list of files
                $files{$File::Find::name} = $mtime;

                # static rendering bits
                if ( $static_or_dynamic eq 'static' ) {
                    ( my $dirname = $File::Find::dir ) =~ s!^$datadir/?!!;
                    my $static_file
                        = "$static_dir/${dirname}index.$static_flavours[0]";
                    if (   $param_all
                        or !-f $static_file
                        or stat($static_file)->mtime < $mtime )
                    {
                        $indexes{$dirname} = 1;
                        if ( $static_date_pages ) {
                            my $d = join( '/', ( nice_date($mtime) )[ 5, 2, 3 ] );
                            $indexes{$d} = $d;
                        }
                        $indexes{"$dirname$basename_noext.$file_extension"}
                            = 1
                            if $static_entries;
                    }
                }
            }

            # not an entries match
            elsif ( !-d $File::Find::name ) {
                $others{$File::Find::name} = stat($File::Find::name)->mtime;
            }
        },
        $datadir
    );

    return ( \%files, \%indexes, \%others );
};

# Plugins: Entries
# Allow for the first encountered plugin::entries subroutine to override the
# default built-in entries subroutine
foreach my $plugin (@plugins) {
    if ( $plugins{$plugin} > 0 and $plugin->can('entries') ) {
        if ( my $tmp = $plugin->entries() ) {
            $entries = $tmp;
            last;
        }
    }
}

my ( $files, $indexes, $others ) = &$entries();
%indexes = %$indexes;

# Static
if ( $static_or_dynamic eq 'static' ) {

    param('-quiet') or print "Blosxom is generating static index pages...\n";

    # Home Page and Directory Indexes
    my %done;
    foreach my $path ( sort keys %indexes ) {
        my $p = '';
        foreach ( ( '', split /\//, $path ) ) {
            $p .= "/$_";
            $p =~ s!^/!!;
            next if $done{$p}++;
            mkdir "$static_dir/$p", 0755
                unless ( -d "$static_dir/$p" or $p =~ /\.$file_extension$/ );
            foreach $flavour (@static_flavours) {
                $content_type
                    = ( &$template( $p, 'content_type', $flavour ) );
                $content_type =~ s!\n.*!!s;
                my $fn = $p =~ m!^(.+)\.$file_extension$! ? $1 : "$p/index";
                param('-quiet') or print "$fn.$flavour\n";
                my $fh_w = new FileHandle "> $static_dir/$fn.$flavour"
                    or die "Couldn't open $static_dir/$p for writing: $!";
                $output = '';
                if ( $indexes{$path} == 1 ) {

                    # category
                    $path_info = $p;

                    # individual story
                    $path_info =~ s!\.$file_extension$!\.$flavour!;
                    print $fh_w &generate( 'static', $path_info, '', $flavour,
                        $content_type );
                }
                else {

                    # date
                    local (
                        $path_info_yr, $path_info_mo,
                        $path_info_da, $path_info
                    ) = split /\//, $p, 4;
                    unless ( defined $path_info ) { $path_info = "" }
                    print $fh_w &generate( 'static', '', $p, $flavour,
                        $content_type );
                }
                $fh_w->close;
            }
        }
    }
}

# Dynamic
else {
    $content_type = ( &$template( $path_info, 'content_type', $flavour ) );
    $content_type =~ s!\n.*!!s;

    $content_type =~ s/(\$\w+(?:::\w+)*)/"defined $1 ? $1 : ''"/gee;
    $header = { -type => $content_type };

    print generate( 'dynamic', $path_info,
        "$path_info_yr/$path_info_mo_num/$path_info_da",
        $flavour, $content_type );
}

# Plugins: End
foreach my $plugin (@plugins) {
    if ( $plugins{$plugin} > 0 and $plugin->can('end') ) {
        $plugin->end();
    }
}

# Generate
sub generate {
    my ( $static_or_dynamic, $currentdir, $date_str, $flavour, $content_type )
        = @_;

    %files = %$files;
    %others = ref $others ? %$others : ();

    # Plugins: Filter
    foreach my $plugin (@plugins) {
        if ( $plugins{$plugin} > 0 and $plugin->can('filter') ) {
            $plugin->filter( \%files, \%others );
        }
    }

    my %f = %files;

    # Plugins: Skip
    # Allow plugins to decide if we can cut short story generation
    my $skip;
    foreach my $plugin (@plugins) {
        if ( $plugins{$plugin} > 0 and $plugin->can('skip') ) {
            last if $skip = $plugin->skip();
        }
    }

    unless ($skip) {

        # Define default interpolation subroutine
        $interpolate = sub {

            package blosxom;
            my $template = shift;

            # Interpolate scalars, namespaced scalars, and hash/hashref scalars
            $template
                =~ s/(\$\w+(?:::\w+)*(?:(?:->)?{([\'\"]?)[-\w]+\2})?)/"defined $1 ? $1 : ''"/gee;
            return $template;
        };

        # Plugins: Interpolate
        # Allow for the first encountered plugin::interpolate subroutine to
        # override the default built-in interpolate subroutine
        foreach my $plugin (@plugins) {
            if ( $plugins{$plugin} > 0 and $plugin->can('interpolate') ) {
                if ( my $tmp = $plugin->interpolate() ) {
                    $interpolate = $tmp;
                    last;
                }
            }
        }

        # Head
        my $head = ( &$template( $currentdir, 'head', $flavour ) );

        # Plugins: Head
        foreach my $plugin (@plugins) {
            if ( $plugins{$plugin} > 0 and $plugin->can('head') ) {
                $plugin->head( $currentdir, \$head );
            }
        }

        $head = &$interpolate($head);

        $output .= $head;

        if ( $currentdir =~ /(.*?)([^\/]+)\.(.+)$/ and $2 ne 'index' ) {
            $currentdir = "$1$2.$file_extension";
            %f = ( "$datadir/$currentdir" => $files{"$datadir/$currentdir"} )
                if $files{"$datadir/$currentdir"};
        }
        else {
            $currentdir =~ s! /index\..+$ !!x;
        }

        # Define a default sort subroutine
        my $sort = sub {
            my ($files_ref) = @_;
            return sort { $files_ref->{$b} <=> $files_ref->{$a} }
                keys %$files_ref;
        };

        # Plugins: Sort
        # Allow for the first encountered plugin::sort subroutine to override the
        # default built-in sort subroutine
        foreach my $plugin (@plugins) {
            if ( $plugins{$plugin} > 0 and $plugin->can('sort') ) {
                if ( my $tmp = $plugin->sort() ) {
                    $sort = $tmp;
                    last;
                }
            }
        }

        # Stories
        my $curdate = '';
        my $ne      = $num_entries;
        foreach my $path_file ( &$sort( \%f, \%others ) ) {
            last if $ne <= 0 && $date_str !~ /\d/;
            use vars qw/ $path $fn /;
            ( $path, $fn )
                = $path_file =~ m!^$datadir/(?:(.*)/)?(.*)\.$file_extension!;

            # Only stories in the right hierarchy
            $path =~ /^$currentdir/
                or $path_file eq "$datadir/$currentdir"
                or next;

            # Prepend a slash for use in templates only if a path exists
            $path &&= "/$path";

            # Date fiddling for by-{year,month,day} archive views
            use vars
                qw/ $dw $mo $mo_num $da $ti $yr $hr $min $hr12 $ampm $utc_offset/;
            ( $dw, $mo, $mo_num, $da, $ti, $yr, $utc_offset )
                = nice_date( $files{"$path_file"} );
            ( $hr, $min ) = split /:/, $ti;
            ( $hr12, $ampm ) = $hr >= 12 ? ( $hr - 12, 'pm' ) : ( $hr, 'am' );
            $hr12 =~ s/^0//;
            if ( $hr12 == 0 ) { $hr12 = 12 }

            # Only stories from the right date
            my ( $path_info_yr, $path_info_mo_num, $path_info_da )
                = split /\//, $date_str;
            next if $path_info_yr     && $yr != $path_info_yr;
            last if $path_info_yr     && $yr < $path_info_yr;
            next if $path_info_mo_num && $mo ne $num2month[$path_info_mo_num];
            next if $path_info_da     && $da != $path_info_da;
            last if $path_info_da     && $da < $path_info_da;

            # Date
            my $date = ( &$template( $path, 'date', $flavour ) );

            # Plugins: Date
            foreach my $plugin (@plugins) {
                if ( $plugins{$plugin} > 0 and $plugin->can('date') ) {
                    $plugin->date( $currentdir, \$date, $files{$path_file},
                        $dw, $mo, $mo_num, $da, $ti, $yr );
                }
            }

            $date = &$interpolate($date);

            # Traditionally blosxom displays the date whenever the date
            # template output changes. If you want to have conditionals
            # in your date template so the output can change without the
            # date changing, set $date_break_on_date_string to true.
            if ( ! $date_break_on_date_string ) {
                if ( $date && $curdate ne $date ) {
                    $curdate = $date;
                    $output .= $date;
                }
            }
            else {
                if ( $date && $curdate ne "$yr/$mo_num/$da" ) {
                    $curdate = "$yr/$mo_num/$da";
                    $output .= $date;
                }
            }

            use vars qw/ $title $body $raw /;
            if ( -f "$path_file" && $fh->open("< $path_file") ) {
                chomp( $title = <$fh> );
                chomp( $body = join '', <$fh> );
                $fh->close;
                $raw = "$title\n$body";
            }
            my $story = ( &$template( $path, 'story', $flavour ) );

            # Plugins: Story
            foreach my $plugin (@plugins) {
                if ( $plugins{$plugin} > 0 and $plugin->can('story') ) {
                    $plugin->story( $path, $fn, \$story, \$title, \$body );
                }
            }

            # Save unescaped versions and allow them to be used in
            # flavour templates.
            use vars qw/$url_unesc $path_unesc $fn_unesc/;
            $url_unesc  = $url;
            $path_unesc = $path;
            $fn_unesc   = $fn;

            # Fix special characters in links inside XML content
            if (   $encode_xml_entities
                && $content_type =~ m{\bxml\b}
                && $content_type !~ m{\bxhtml\b} )
            {

                # Escape special characters inside the <link> container

                &url_escape_url_path_and_fn();

                # Escape <, >, and &, and to produce valid RSS
                $title = blosxom_html_escape($title);
                $body  = blosxom_html_escape($body);
                $url   = blosxom_html_escape($url);
                $path  = blosxom_html_escape($path);
                $fn    = blosxom_html_escape($fn);
            }

            # Fix special characters in links inside XML content
            if ($encode_8bit_chars) {
                &url_escape_url_path_and_fn();
            }

            $story = &$interpolate($story);

            $output .= $story;
            $fh->close;

            $ne--;
        }

        # Foot
        my $foot = ( &$template( $currentdir, 'foot', $flavour ) );

        # Plugins: Foot
        foreach my $plugin (@plugins) {
            if ( $plugins{$plugin} > 0 and $plugin->can('foot') ) {
                $plugin->foot( $currentdir, \$foot );
            }
        }

        $foot = &$interpolate($foot);
        $output .= $foot;

        # Plugins: Last
        foreach my $plugin (@plugins) {
            if ( $plugins{$plugin} > 0 and $plugin->can('last') ) {
                $plugin->last();
            }
        }

    }    # End skip

    # Finally, add the header, if any and running dynamically
    $output = header($header) . $output
        if ( $static_or_dynamic eq 'dynamic' and $header );

    $output;
}

sub nice_date {
    my ($unixtime) = @_;

    my $c_time = CORE::localtime($unixtime);
    my ( $dw, $mo, $da, $hr, $min, $sec, $yr )
        = ( $c_time
            =~ /(\w{3}) +(\w{3}) +(\d{1,2}) +(\d{2}):(\d{2}):(\d{2}) +(\d{4})$/
        );
    $ti = "$hr:$min";
    $da = sprintf( "%02d", $da );
    my $mo_num = $month2num{$mo};

    my $offset
        = timegm( $sec, $min, $hr, $da, $mo_num - 1, $yr - 1900 ) - $unixtime;
    my $utc_offset = sprintf( "%+03d", int( $offset / 3600 ) )
        . sprintf( "%02d", ( $offset % 3600 ) / 60 );

    return ( $dw, $mo, $mo_num, $da, $ti, $yr, $utc_offset );
}

sub url_escape_url_path_and_fn {
    $url  =~ s($url_escape_re)(sprintf('%%%02X', ord($&)))eg;
    $path =~ s($url_escape_re)(sprintf('%%%02X', ord($&)))eg;
    $fn   =~ s($url_escape_re)(sprintf('%%%02X', ord($&)))eg;
}

# Default HTML and RSS template bits
__DATA__
html content_type text/html; charset=$blog_encoding

html head <!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
html head <html>
html head     <head>
html head         <meta http-equiv="content-type" content="$content_type" >
html head         <link rel="alternate" type="application/rss+xml" title="RSS" href="$url/index.rss" >
html head         <title>$blog_title $path_info_da $path_info_mo $path_info_yr</title>
html head     </head>
html head     <body>
html head         <div align="center">
html head             <h1>$blog_title</h1>
html head             <p>$path_info_da $path_info_mo $path_info_yr</p>
html head         </div>

html story         <div>
html story             <h3><a name="$fn">$title</a></h3>
html story             <div>$body</div>
html story             <p>posted at: $ti | path: <a href="$url$path">$path</a> | <a href="$url/$yr/$mo_num/$da#$fn">permanent link to this entry</a></p>
html story         </div>

html date         <h2>$dw, $da $mo $yr</h2>

html foot
html foot         <div align="center">
html foot             <a href="http://blosxom.sourceforge.net/"><img src="http://blosxom.sourceforge.net/images/pb_blosxom.gif" alt="powered by blosxom" border="0" width="90" height="33" ></a>
html foot         </div>
html foot     </body>
html foot </html>

rss content_type text/xml; charset=$blog_encoding

rss head <?xml version="1.0" encoding="$blog_encoding"?>
rss head <rss version="2.0">
rss head   <channel>
rss head     <title>$blog_title</title>
rss head     <link>$url/$path_info</link>
rss head     <description>$blog_description</description>
rss head     <language>$blog_language</language>
rss head     <docs>http://blogs.law.harvard.edu/tech/rss</docs>
rss head     <generator>blosxom/$version</generator>

rss story   <item>
rss story     <title>$title</title>
rss story     <pubDate>$dw, $da $mo $yr $ti:00 $utc_offset</pubDate>
rss story     <link>$url/$yr/$mo_num/$da#$fn</link>
rss story     <category>$path</category>
rss story     <guid isPermaLink="false">$url$path/$fn</guid>
rss story     <description>$body</description>
rss story   </item>

rss date 

rss foot   </channel>
rss foot </rss>

error content_type text/html

error head <!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
error head <html>
error head <head><title>Error: unknown Blosxom flavour "$flavour"</title></head>
error head     <body>
error head         <h1><font color="red">Error: unknown Blosxom flavour "$flavour"</font></h1>
error head         <p>I'm afraid this is the first I've heard of a "$flavour" flavoured Blosxom.  Try dropping the "/+$flavour" bit from the end of the URL.</p>

error story        <h3>$title</h3>
error story        <div>$body</div> <p><a href="$url/$yr/$mo_num/$da#fn.$default_flavour">#</a></p>

error date         <h2>$dw, $da $mo $yr</h2>

error foot     </body>
error foot </html>
__END__

