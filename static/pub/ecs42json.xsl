<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:aws="http://webservices.amazon.com/AWSECommerceService/2005-07-26">

  <xsl:output method="text" media-type="text/javascript" encoding="UTF-8"/>

  <xsl:template match="/">
var ItemSearchResponse = {
  Keywords: &quot;<xsl:value-of select="aws:ItemSearchResponse/aws:Items/aws:Request/aws:ItemSearchRequest/aws:Keywords"/>&quot;,
  Items: [
    <xsl:apply-templates select="aws:ItemSearchResponse/aws:Items/aws:Item"/>
    null
  ]
};
  </xsl:template>

  <xsl:template match="/aws:ItemSearchResponse/aws:Items/aws:Item">
    {
      Title: &quot;<xsl:value-of select="aws:ItemAttributes/aws:Title"/>&quot;,
      URL: &quot;<xsl:value-of select="aws:DetailPageURL"/>&quot;,
      Author: &quot;<xsl:value-of select="aws:ItemAttributes/aws:Author"/>&quot;,
      Publisher: &quot;<xsl:value-of select="aws:ItemAttributes/aws:Publisher"/>&quot;,
      Price: &quot;<xsl:value-of select="aws:OfferSummary/aws:LowestNewPrice/aws:FormattedPrice"/>&quot;,
      Image: {
        URL: &quot;<xsl:value-of select="aws:MediumImage/aws:URL"/>&quot;,
        Width: <xsl:value-of select="aws:MediumImage/aws:Width"/>,
        Height: <xsl:value-of select="aws:MediumImage/aws:Height"/>
      }
    },
  </xsl:template>

</xsl:stylesheet>
