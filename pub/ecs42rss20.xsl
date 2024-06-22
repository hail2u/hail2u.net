<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:aws="http://webservices.amazon.com/AWSECommerceService/2005-07-26">

  <xsl:output method="xml" encoding="UTF-8" cdata-section-elements="description"/>

  <xsl:template match="/">
    <rss version="2.0">
      <channel>
        <title>Amazon.co.jp の 和書 から &quot;<xsl:value-of select="aws:ItemSearchResponse/aws:Items/aws:Request/aws:ItemSearchRequest/aws:Keywords"/>&quot;を検索しました</title>
        <link>http://www.amazon.co.jp/</link>
        <description>Amazon.co.jpの和書ストアから &quot;<xsl:value-of select="aws:ItemSearchResponse/aws:Items/aws:Request/aws:ItemSearchRequest/aws:Keywords"/>&quot; を検索した結果のRSS 2.0フィードです。</description>
        <language>ja-JP</language>
        <xsl:apply-templates select="aws:ItemSearchResponse/aws:Items/aws:Item"/>
      </channel>
    </rss>
  </xsl:template>

  <xsl:template match="/aws:ItemSearchResponse/aws:Items/aws:Item">
    <item>
      <title><xsl:value-of select="aws:ItemAttributes/aws:Title"/></title>
      <link><xsl:value-of select="aws:DetailPageURL"/></link>
      <description>&lt;table&gt;&lt;tr&gt;&lt;td rowspan=&quot;4&quot;&gt;&lt;img src=&quot;<xsl:value-of select="aws:MediumImage/aws:URL"/>&quot; alt=&quot;<xsl:value-of select="aws:ItemAttributes/aws:Title"/>&quot; width=&quot;<xsl:value-of select="aws:MediumImage/aws:Width"/>&quot; height=&quot;<xsl:value-of select="aws:MediumImage/aws:Height"/>&quot;/&gt;&lt;/td&gt;&lt;td&gt;タイトル&lt;/td&gt;&lt;td&gt;<xsl:value-of select="aws:ItemAttributes/aws:Title"/>&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;著者&lt;/td&gt;&lt;td&gt;<xsl:value-of select="aws:ItemAttributes/aws:Author"/>&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;出版社&lt;/td&gt;&lt;td&gt;<xsl:value-of select="aws:ItemAttributes/aws:Publisher"/>&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;価格&lt;/td&gt;&lt;td&gt;<xsl:value-of select="aws:OfferSummary/aws:LowestNewPrice/aws:FormattedPrice"/>&lt;/td&gt;&lt;/tr&gt;&lt;/table&gt;</description>
    </item>
  </xsl:template>

</xsl:stylesheet>

