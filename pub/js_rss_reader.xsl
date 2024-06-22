<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	xmlns="http://www.w3.org/1999/xhtml"
	xmlns:rss="http://purl.org/rss/1.0/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	exclude-result-prefixes="rdf rss dc"
>

	<xsl:template match="/">
		<xsl:call-template name="RDF" />
	</xsl:template>

	<xsl:template name="RDF">
		<h2>
			<a>
				<xsl:attribute name="href">
					<xsl:value-of select="rdf:RDF/rss:channel/rss:link"/>
				</xsl:attribute>
				<xsl:value-of select="rdf:RDF/rss:channel/rss:title"/>
			</a>
		</h2>
		<p>
			<xsl:value-of select="rdf:RDF/rss:channel/rss:description"/>
		</p>
		<dl>
			<xsl:for-each select="rdf:RDF/rss:item">
				<dt>
					<a>
						<xsl:attribute name="href">
							<xsl:value-of select="rss:link"/>
						</xsl:attribute>
						<xsl:value-of select="rss:title"/>
					</a>
				</dt>
				<dd>
					<xsl:value-of select="rss:description"/>
				</dd>
			</xsl:for-each>
		</dl>
	</xsl:template>

</xsl:stylesheet>
